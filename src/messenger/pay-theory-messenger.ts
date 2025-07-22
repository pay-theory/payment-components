import MessengerChannel from './messenger-channel';
import StateManager, { MessengerState } from './state-manager';
import TokenManager from './token-manager';
import {
  ApplePaySessionResponse,
  MessengerAppleMerchantValidationMessage,
  MessengerResponse,
  MessengerSocketErrorMessage,
  MessengerTransferCompleteMessage,
  TransactionResponse,
  WalletTransactionPayload,
  WalletTransactionPayloadServer,
} from './types';

import { hostedFieldsEndpoint } from '../common/network';
import { ErrorResponse, ResponseMessageTypes } from '../common/pay_theory_types';
import { generateUUID } from '../field-set/payment-fields-v2';
import {
  PT_MESSENGER_MERCHANT_VALIDATION,
  PT_MESSENGER_PING,
  PT_MESSENGER_READY,
  PT_MESSENGER_RECONNECT_TOKEN,
  PT_MESSENGER_SOCKET_ERROR,
  PT_MESSENGER_TRANSFER_COMPLETE,
  PT_MESSENGER_WALLET_TRANSACTION,
  PT_WALLET_TYPE_APPLE,
  PT_WALLET_TYPE_GOOGLE,
  PT_WALLET_TYPE_PAZE,
  MessengerEvent,
  MessengerEvents,
} from './constants';

class PayTheoryMessenger {
  private static instances: Map<string, PayTheoryMessenger> = new Map();
  private apiKey: string;
  private sessionId?: string;
  private iframe: HTMLIFrameElement | null = null;
  private tokenManager: TokenManager;
  private channel: MessengerChannel | null = null;
  private state: StateManager;
  private eventListeners: Map<string, Function[]> = new Map();
  private globalEventListeners: Array<{ type: string; handler: EventListener }> = [];
  private initializationPromise: Promise<MessengerResponse> | null = null;
  private refreshPromise: Promise<MessengerResponse> | null = null;

  // Static Constants
  static readonly applePay = PT_WALLET_TYPE_APPLE;
  static readonly googlePay = PT_WALLET_TYPE_GOOGLE;
  static readonly paze = PT_WALLET_TYPE_PAZE;

  constructor(options: { apiKey: string }) {
    // Check if instance already exists for this API key
    const existingInstance = PayTheoryMessenger.instances.get(options.apiKey);
    if (existingInstance) {
      console.warn('PayTheoryMessenger instance already exists for this API key');
      return existingInstance;
    }

    this.apiKey = options.apiKey;
    this.sessionId = generateUUID();
    this.tokenManager = new TokenManager(this.apiKey, this.sessionId);
    this.state = new StateManager();

    // Register this instance
    PayTheoryMessenger.instances.set(options.apiKey, this);
  }

  // Static method to clear instances (internal use only - for testing)
  /** @internal */
  static clearInstances(): void {
    PayTheoryMessenger.instances.forEach(instance => instance.destroy());
    PayTheoryMessenger.instances.clear();
  }

  /**
   * Initialize the messenger - create iframe and establish connection
   */
  async initialize(): Promise<MessengerResponse> {
    // Prevent multiple simultaneous initialization
    if (this.initializationPromise) {
      return await this.initializationPromise;
    }

    if (this.state.getState() !== MessengerState.IDLE) {
      // Already initialized or initializing
      return this.ensureConnected();
    }

    // Create and store the initialization promise
    this.initializationPromise = this.doInitialize();

    try {
      const result = await this.initializationPromise;
      return result;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async doInitialize(): Promise<MessengerResponse> {
    try {
      this.state.setState(MessengerState.INITIALIZING);

      // Get token first
      const token = await this.tokenManager.getToken();

      // Create token string for iframe URL
      const tokenObj = {
        origin: window.location.origin,
        sessionKey: this.sessionId,
        token,
      };
      const tokenString = this.createTokenString(tokenObj);

      // Create iframe with token
      this.createIframe(tokenString);
      // Wait for iframe to load
      await this.waitForIframeReady();

      // Initialize the communication channel
      // Ok to use ! because we know the iframe is created just a few lines above
      this.channel = new MessengerChannel(this.iframe!);
      await this.channel.connect();
      this.state.setState(MessengerState.CONNECTED);
      this.emitEvent(MessengerEvents.READY, { success: true });

      return { success: true };
    } catch (error) {
      console.error('Error during initialization', error);
      this.state.setState(MessengerState.ERROR);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during initialization',
      };
    }
  }

  /**
   * Create token string for iframe URL
   */
  private createTokenString(tokenObj: {
    origin: string;
    sessionKey?: string;
    token: string;
  }): string {
    const json = JSON.stringify(tokenObj);
    const encodedJson = window.btoa(json);
    return encodeURI(encodedJson);
  }

  /**
   * Create the messenger iframe
   */
  private createIframe(tokenString: string): HTMLIFrameElement {
    if (this.iframe) {
      return this.iframe;
    }

    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.style.width = '0';
    this.iframe.style.height = '0';
    this.iframe.style.border = '0';
    this.iframe.setAttribute('title', 'Payment Theory Messenger');
    this.iframe.setAttribute('aria-hidden', 'true');

    // Add cleanup on iframe unload
    this.iframe.addEventListener('beforeunload', () => {
      this.handleIframeUnload();
    });

    // For older browsers, also listen to unload
    this.iframe.addEventListener('unload', () => {
      this.handleIframeUnload();
    });

    // Set the iframe source to the secure tags lib messenger URL with token
    this.iframe.src = `${hostedFieldsEndpoint}/messenger?token=${tokenString}`;

    // Append to body
    document.body.appendChild(this.iframe);

    return this.iframe;
  }

  /**
   * Wait for iframe to be fully ready using bidirectional handshake
   */
  private waitForIframeReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.iframe) {
        reject(new Error('Iframe does not exist'));
        return;
      }

      let pingInterval: NodeJS.Timeout | undefined;
      let loadEventHandler: (() => void) | undefined;
      let readyMessageListener: ((event: MessageEvent) => void) | undefined;
      let timeout: NodeJS.Timeout | undefined;

      // Cleanup function to ensure all resources are freed
      const cleanup = () => {
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = undefined;
        }
        if (loadEventHandler && this.iframe) {
          this.iframe.removeEventListener('load', loadEventHandler);
          loadEventHandler = undefined;
        }
        if (readyMessageListener) {
          window.removeEventListener('message', readyMessageListener);
          // Remove from tracked listeners
          this.globalEventListeners = this.globalEventListeners.filter(
            l => l.handler !== readyMessageListener,
          );
          readyMessageListener = undefined;
        }
      };

      // Set a reasonable timeout
      timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Iframe ready timeout'));
      }, 15000);

      // Then establish a handshake with the iframe content
      const setupMessageListener = () => {
        // Set up a one-time message listener for the ready signal
        readyMessageListener = (event: MessageEvent) => {
          // Verify the origin for security
          if (!this.isValidOrigin(event.origin)) return;

          // Check if it's our ready message
          if (event.data && event.data.type === PT_MESSENGER_READY) {
            console.log('Iframe ready');
            cleanup();
            resolve();
          }
        };

        // Track the listener
        this.globalEventListeners.push({
          type: 'message',
          handler: readyMessageListener,
        });

        window.addEventListener('message', readyMessageListener);

        // Send a ping to the iframe to check if it's already ready
        // (in case we missed the ready event)
        this.sendPingToIframe();

        // Also set an interval to keep pinging until we get a response
        pingInterval = setInterval(() => {
          this.sendPingToIframe();
        }, 500);
      };

      // First wait for the iframe to load
      const checkIframeLoaded = () => {
        if (this.iframe?.contentDocument?.readyState === 'complete') {
          setupMessageListener();
        } else {
          loadEventHandler = setupMessageListener;
          this.iframe?.addEventListener('load', loadEventHandler, { once: true });
        }
      };

      checkIframeLoaded();
    });
  }

  /**
   * Send a ping message to the iframe
   */
  private sendPingToIframe(): void {
    if (!this.iframe || !this.iframe.contentWindow) return;

    try {
      this.iframe.contentWindow.postMessage({ type: PT_MESSENGER_PING }, '*');
    } catch {
      // Ignore failures, we'll retry
    }
  }

  /**
   * Check if the origin is valid
   */
  private isValidOrigin(origin: string): boolean {
    // Check if the origin is allowed
    const allowedOrigins = [hostedFieldsEndpoint];
    return allowedOrigins.indexOf(origin) !== -1;
  }

  /**
   * Ensure the messenger is connected before performing operations
   */
  private async ensureConnected(): Promise<MessengerResponse> {
    const currentState = this.state.getState();

    if (currentState === MessengerState.CONNECTED) {
      return { success: true };
    }

    if (currentState === MessengerState.INITIALIZING) {
      // If we have an initialization promise, wait for it
      if (this.initializationPromise) {
        return await this.initializationPromise;
      }

      // Otherwise wait for state change with timeout
      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          clearInterval(checkInterval);
          resolve({ success: false, error: 'Connection timeout' });
        }, 30000);

        const checkInterval = setInterval(() => {
          const state = this.state.getState();
          if (state === MessengerState.CONNECTED) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve({ success: true });
          } else if (state === MessengerState.ERROR) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve({ success: false, error: 'Messenger initialization failed' });
          }
        }, 100);
      });
    }

    // Try to re-initialize
    if (currentState === MessengerState.ERROR || currentState === MessengerState.IDLE) {
      return this.initialize();
    }

    return { success: false, error: 'Invalid messenger state' };
  }

  /**
   * Refresh the connection with a new token
   */
  private async refreshConnection(): Promise<MessengerResponse> {
    // Prevent concurrent refresh attempts
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this.doRefreshConnection();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefreshConnection(): Promise<MessengerResponse> {
    try {
      this.state.setState(MessengerState.REFRESHING);

      // Get new token
      await this.tokenManager.refreshToken();
      const token = await this.tokenManager.getToken();

      // Send new token
      const result = await this.sendReconnectToken(token);

      if (!result.success) {
        console.error('Error refreshing connection', result);
        this.state.setState(MessengerState.ERROR);
        return result;
      }

      this.state.setState(MessengerState.CONNECTED);
      return { success: true };
    } catch (error) {
      console.error('Error refreshing connection', error);
      this.state.setState(MessengerState.ERROR);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error refreshing connection',
      };
    }
  }

  /**
   * Send reconnect token to the iframe
   */
  private async sendReconnectToken(token: string): Promise<MessengerResponse> {
    try {
      if (!this.channel) {
        return {
          success: false,
          error: 'Channel not initialized',
        };
      }

      const response = await this.channel.sendMessage<{ token: string }, MessengerResponse>(
        PT_MESSENGER_RECONNECT_TOKEN,
        { token },
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending reconnect token',
      };
    }
  }

  /**
   * Get Apple Pay session for merchant validation
   */
  async getApplePaySession(): Promise<ApplePaySessionResponse | ErrorResponse> {
    try {
      console.log('Getting Apple Pay session');
      // Ensure connected
      const connectionCheck = await this.ensureConnected();
      if (!connectionCheck.success) {
        return {
          type: ResponseMessageTypes.ERROR,
          error: connectionCheck.error || 'Failed to ensure connection',
        };
      }
      if (!this.channel) {
        return {
          type: ResponseMessageTypes.ERROR,
          error: 'Channel not initialized',
        };
      }
      // Send message to get Apple Pay session
      const response = await this.channel.sendMessage<
        void,
        MessengerAppleMerchantValidationMessage
      >(PT_MESSENGER_MERCHANT_VALIDATION);

      if (!response.body.success && response.body.error === 'TOKEN_EXPIRED') {
        // Token expired, try refreshing and retry
        const refreshResult = await this.refreshConnection();
        if (!refreshResult.success) {
          return {
            type: ResponseMessageTypes.ERROR,
            error: refreshResult.error || 'Failed to refresh connection',
          };
        }

        // Retry after refresh
        return this.channel.sendMessage<void, ApplePaySessionResponse>(
          PT_MESSENGER_MERCHANT_VALIDATION,
        );
      }

      return {
        type: ResponseMessageTypes.SUCCESS,
        session: response.body,
      };
    } catch (error) {
      console.error('Error getting Apple Pay session', error);
      return {
        type: ResponseMessageTypes.ERROR,
        error: error instanceof Error ? error.message : 'Unknown error getting Apple Pay session',
      };
    }
  }

  /**
   * Process a wallet transaction
   */
  async processWalletTransaction(
    payload: WalletTransactionPayload,
  ): Promise<TransactionResponse | ErrorResponse> {
    try {
      // Validate required fields
      if (!payload.amount || !payload.digitalWalletPayload || !payload.walletType) {
        return {
          type: ResponseMessageTypes.ERROR,
          error:
            'Missing required fields: amount, digitalWalletPayload, and walletType are required',
        };
      }

      if (!this.channel) {
        return {
          type: ResponseMessageTypes.ERROR,
          error: 'Channel not initialized',
        };
      }

      // Ensure connected
      const connectionCheck = await this.ensureConnected();
      if (!connectionCheck.success) {
        return {
          type: ResponseMessageTypes.ERROR,
          error: connectionCheck.error || 'Failed to ensure connection',
        };
      }

      // Format the payload for the backend
      const formattedPayload: WalletTransactionPayloadServer = {
        digital_wallet_payload: payload.digitalWalletPayload,
        amount: payload.amount,
        payor: payload.payor,
        reference: payload.reference,
        account_code: payload.accountCode,
        metadata: payload.metadata,
        additional_purchase_data: payload.additionalPurchaseData,
        billing_address: payload.billingAddress,
        fee: payload.fee,
        health_expense_type: payload.healthExpenseType,
        invoice_id: payload.invoiceId,
        receipt_description: payload.receiptDescription,
        payor_id: payload.payorId,
        recurring_id: payload.recurringId,
        send_receipt: payload.sendReceipt,
        split: payload.split,
        wallet_type: payload.walletType,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Send transaction
      this.state.setState(MessengerState.PROCESSING);
      const response = await this.channel.sendMessage<
        any,
        MessengerSocketErrorMessage | MessengerTransferCompleteMessage
      >(PT_MESSENGER_WALLET_TRANSACTION, formattedPayload);

      console.log('Wallet Transaction Response PC', response);

      // Handle error responses (from secure-tags-lib error handling)
      if (response.type === PT_MESSENGER_SOCKET_ERROR) {
        const errorMsg = response.body.error || 'Unknown error';

        // Handle token expiration
        if (errorMsg === 'TOKEN_EXPIRED') {
          // Token expired, try refreshing and retry
          const refreshResult = await this.refreshConnection();
          if (!refreshResult.success) {
            console.error('Error refreshing connection', refreshResult);
            this.state.setState(MessengerState.ERROR);
            return {
              type: ResponseMessageTypes.ERROR,
              error: refreshResult.error || 'Failed to refresh connection',
            };
          }

          // Retry after refresh
          this.state.setState(MessengerState.PROCESSING);
          const retryResponse = await this.channel.sendMessage<any, any>(
            PT_MESSENGER_WALLET_TRANSACTION,
            formattedPayload,
          );

          // Process retry response
          if (retryResponse.type === 'pt-static:error') {
            console.error('Error processing transaction after refresh', retryResponse);
            this.state.setState(MessengerState.ERROR);
            this.emitEvent(MessengerEvents.TRANSACTION_ERROR, { error: retryResponse.error });
            return {
              type: ResponseMessageTypes.ERROR,
              error: retryResponse.error || 'Transaction failed after token refresh',
            };
          }

          // Update response to process below
          Object.assign(response, retryResponse);
        } else {
          // Other errors
          console.error('Error processing transaction', response);
          this.state.setState(MessengerState.ERROR);
          this.emitEvent(MessengerEvents.TRANSACTION_ERROR, { error: errorMsg });
          return {
            type: ResponseMessageTypes.ERROR,
            error: errorMsg,
          };
        }
      }

      // Handle PT_MESSENGER_TRANSFER_COMPLETE responses
      if (response.type === PT_MESSENGER_TRANSFER_COMPLETE && response.body?.transaction) {
        const transaction = response.body.transaction;

        // Check if transaction failed
        if (transaction.status === 'FAILED') {
          // Refresh connection for retry with new host token
          await this.refreshConnection();

          this.state.setState(MessengerState.ERROR);
          this.emitEvent(MessengerEvents.TRANSACTION_ERROR, { transaction });

          return {
            type: ResponseMessageTypes.SUCCESS,
            transaction,
          };
        }

        // Transaction is pending or successful
        this.state.setState(MessengerState.COMPLETED);
        this.emitEvent(MessengerEvents.TRANSACTION_COMPLETE, { transaction });

        return {
          type: ResponseMessageTypes.SUCCESS,
          transaction,
        };
      }

      // Unexpected response format
      console.error('Unexpected response format', response);
      this.state.setState(MessengerState.ERROR);
      return {
        type: ResponseMessageTypes.ERROR,
        error: 'Unexpected response format',
      };
    } catch (error) {
      console.error('Error processing transaction', error);
      this.state.setState(MessengerState.ERROR);
      return {
        type: ResponseMessageTypes.ERROR,
        error: error instanceof Error ? error.message : 'Unknown error processing transaction',
      };
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // 1. Clean up all event listeners
    this.cleanupEventListeners();

    // 2. Disconnect channel before removing iframe
    if (this.channel) {
      this.channel.disconnect();
      this.channel = null;
    }

    // 3. Remove iframe from DOM
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }

    // 4. Clear token manager
    this.tokenManager.cleanup();

    // 5. Reset state
    this.state.setState(MessengerState.IDLE);
    this.eventListeners.clear();

    // 6. Remove from instances map
    PayTheoryMessenger.instances.delete(this.apiKey);
  }

  private cleanupEventListeners(): void {
    // Remove any global event listeners
    this.globalEventListeners.forEach(({ type, handler }) => {
      window.removeEventListener(type, handler);
    });
    this.globalEventListeners = [];
  }

  private handleIframeUnload(): void {
    console.warn('PayTheoryMessenger iframe is being unloaded');
    // Notify consumers via event
    this.emitEvent(MessengerEvents.IFRAME_UNLOADED, { timestamp: Date.now() });
    // Clean up resources
    this.cleanupEventListeners();
  }

  /**
   * Event handling methods
   */
  on(event: MessengerEvent, callback: Function): () => void {
    // Validate event at runtime (optional - TypeScript will catch at compile time)
    const validEvents = Object.values(MessengerEvents);
    if (!validEvents.includes(event)) {
      console.error(`Invalid event: ${event}. Valid events are: ${validEvents.join(', ')}`);
      return () => {}; // Return no-op unsubscribe function
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event)?.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  private emitEvent(event: MessengerEvent, data: any): void {
    if (!this.eventListeners.has(event)) {
      return;
    }

    const listeners = this.eventListeners.get(event) || [];

    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }
}

export default PayTheoryMessenger;
