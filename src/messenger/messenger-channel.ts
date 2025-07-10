import {
  OUTGOING_MESSENGER_TYPES,
  PT_MESSENGER_ESTABLISH_CHANNEL,
  PT_MESSENGER_SOCKET_ERROR,
} from './constants';

class MessengerChannel {
  private iframe: HTMLIFrameElement;
  private messageChannel: MessageChannel | null = null;
  private port: MessagePort | null = null;
  private messageQueue: Map<string, { resolve: Function; reject: Function }> = new Map();
  private messageCounter: number = 0;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  /**
   * Connect to the iframe using MessageChannel
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create a message channel
        this.messageChannel = new MessageChannel();
        this.port = this.messageChannel.port1;

        // Set up message listener
        this.port.onmessage = this.handleMessage.bind(this);

        // Set up connection timeout
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        // Create a message ID for the channel establishment
        const establishChannelMessageId = `establish_channel_${this.messageCounter++}_${Date.now()}`;

        // Add the establishment message to the queue
        this.messageQueue.set(establishChannelMessageId, {
          resolve: () => {
            clearTimeout(timeout);
            resolve();
          },
          reject,
        });

        // Send the channel's port2 to the iframe
        this.iframe.contentWindow?.postMessage(
          {
            type: PT_MESSENGER_ESTABLISH_CHANNEL,
            messageId: establishChannelMessageId,
          },
          '*',
          [this.messageChannel.port2],
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a message to the iframe and return a promise for the response
   */
  sendMessage<T, R>(type: OUTGOING_MESSENGER_TYPES, data?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.port) {
        reject(new Error('Channel not connected'));
        return;
      }

      // Generate unique message ID
      const messageId = `${type}_${this.messageCounter++}_${Date.now()}`;

      // Store the promise callbacks
      this.messageQueue.set(messageId, { resolve, reject });

      // Set up timeout to prevent hanging promises
      setTimeout(() => {
        if (this.messageQueue.has(messageId)) {
          this.messageQueue.delete(messageId);
          reject(new Error('Message timeout'));
        }
      }, 30000);

      // Send the message
      this.port.postMessage({
        type,
        messageId,
        data,
      });
    });
  }

  /**
   * Handle incoming messages from the iframe
   */
  private handleMessage(event: MessageEvent): void {
    const eventData = event.data;
    const { messageId, type, error } = eventData;

    if (!messageId || !this.messageQueue.has(messageId)) {
      return;
    }

    const { resolve, reject } = this.messageQueue.get(messageId)!;
    this.messageQueue.delete(messageId);

    if (type === PT_MESSENGER_SOCKET_ERROR) {
      reject(new Error(error || 'Unknown error'));
    } else {
      resolve(eventData);
    }
  }

  /**
   * Disconnect the channel
   */
  disconnect(): void {
    if (this.port) {
      this.port.onmessage = null;
      this.port.close();
      this.port = null;
    }

    if (this.messageChannel) {
      this.messageChannel = null;
    }

    // Reject any pending messages
    for (const [messageId, { reject }] of this.messageQueue.entries()) {
      reject(new Error('Channel disconnected'));
      this.messageQueue.delete(messageId);
    }
  }
}

export default MessengerChannel;
