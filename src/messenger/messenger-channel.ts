import {
  OUTGOING_MESSENGER_TYPES,
  PT_MESSENGER_ESTABLISH_CHANNEL,
  PT_MESSENGER_CONNECTION_ACK,
  PT_MESSENGER_SOCKET_ERROR,
} from './constants';

interface PendingMessage {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timeoutId: NodeJS.Timeout;
}

class MessengerChannel {
  private iframe: HTMLIFrameElement;
  private port: MessagePort | null = null;
  private pendingMessages: Map<string, PendingMessage> = new Map();
  private messageCounter: number = 0;
  private connected: boolean = false;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  /**
   * Simplified connection using promise-based approach
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      this.port = channel.port1;

      // Set up message handler
      this.port.onmessage = this.handleMessage.bind(this);

      // Send port2 to iframe with a simple handshake
      const handshakeId = this.generateMessageId(PT_MESSENGER_ESTABLISH_CHANNEL);

      // Set up one-time handshake handler
      const cleanup = this.registerPendingMessage(handshakeId, resolve, reject, 5000);

      // Transfer port2 to iframe
      this.iframe.contentWindow?.postMessage(
        {
          type: PT_MESSENGER_ESTABLISH_CHANNEL,
          messageId: handshakeId,
        },
        '*',
        [channel.port2],
      );
    });
  }

  /**
   * Simplified message sending
   */
  async sendMessage<T, R>(type: OUTGOING_MESSENGER_TYPES, data?: T): Promise<R> {
    if (!this.port || !this.connected) {
      throw new Error('Channel not connected');
    }

    const messageId = this.generateMessageId(type);

    return new Promise((resolve, reject) => {
      // Register the pending message with timeout
      this.registerPendingMessage(messageId, resolve, reject, 30000);

      // Send the message
      this.port!.postMessage({ type, messageId, data });
    });
  }

  private registerPendingMessage(
    messageId: string,
    resolve: (value: any) => void,
    reject: (reason: any) => void,
    timeout: number,
  ): () => void {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (this.pendingMessages.has(messageId)) {
        this.pendingMessages.delete(messageId);
        reject(new Error(`Message timeout: ${messageId}`));
      }
    }, timeout);

    // Store the pending message
    this.pendingMessages.set(messageId, { resolve, reject, timeoutId });

    // Return cleanup function
    return () => {
      const pending = this.pendingMessages.get(messageId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        this.pendingMessages.delete(messageId);
      }
    };
  }

  private handleMessage(event: MessageEvent): void {
    const { messageId, type, error, ...data } = event.data;

    // Handle connection acknowledgment
    if (messageId && this.pendingMessages.has(messageId)) {
      const { resolve, reject, timeoutId } = this.pendingMessages.get(messageId)!;
      clearTimeout(timeoutId);
      this.pendingMessages.delete(messageId);

      if (type === PT_MESSENGER_CONNECTION_ACK) {
        this.connected = true;
        resolve(data);
      } else if (error || type === PT_MESSENGER_SOCKET_ERROR) {
        reject(new Error(error || 'Unknown error'));
      } else {
        resolve(event.data);
      }
    }
  }

  private generateMessageId(type: string): string {
    return `${type}_${this.messageCounter++}_${Date.now()}`;
  }

  disconnect(): void {
    // Clear all pending messages
    this.pendingMessages.forEach(({ reject, timeoutId }) => {
      clearTimeout(timeoutId);
      reject(new Error('Channel disconnected'));
    });
    this.pendingMessages.clear();

    // Close the port
    if (this.port) {
      this.port.onmessage = null;
      this.port.close();
      this.port = null;
    }

    this.connected = false;
  }
}

export default MessengerChannel;
