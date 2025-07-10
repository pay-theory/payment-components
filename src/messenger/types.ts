import {
  PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
  PT_MESSENGER_CONNECTION_ACK,
  PT_MESSENGER_ESTABLISH_CHANNEL,
  PT_MESSENGER_MERCHANT_VALIDATION,
  PT_MESSENGER_PING,
  PT_MESSENGER_READY,
  PT_MESSENGER_RECONNECT_TOKEN,
  PT_MESSENGER_RECONNECT_TOKEN_SUCCESS,
  PT_MESSENGER_SOCKET_CONNECTED,
  PT_MESSENGER_SOCKET_ERROR,
  PT_MESSENGER_TRANSFER_COMPLETE,
  PT_MESSENGER_WALLET_TRANSACTION,
} from './constants';

// Basic response type
export interface MessengerResponse {
  success: boolean;
  error?: string;
}

// Apple Pay session response
export interface ApplePaySessionResponse extends MessengerResponse {
  session?: any;
}

// Transaction response
export interface TransactionResponse extends MessengerResponse {
  transaction_id?: string | null;
  status?: string;
  amount?: number;
  created?: string;
}

// Error response
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

// Wallet transaction payload
export interface WalletTransactionPayload {
  amount: number;
  digitalWalletPayload: any;
  walletType: string;
  payor?: any;
  reference?: string;
  accountCode?: string;
  metadata?: any;
  additionalPurchaseData?: any;
  billingAddress?: any;
  fee?: number;
  healthExpenseType?: string;
  invoiceId?: string;
  receiptDescription?: string;
  payorId?: string;
  recurringId?: string;
  sendReceipt?: boolean;
  split?: any;
}

/**
 * Incoming messages (Messenger → Payment Components)
 */
export interface MessengerConnectionAckMessage {
  type: typeof PT_MESSENGER_CONNECTION_ACK;
  success: boolean;
  messageId: string;
}

export interface MessengerSocketConnectedMessage {
  type: typeof PT_MESSENGER_SOCKET_CONNECTED;
  messageId: string;
  body: {
    success: boolean;
  };
}

export interface MessengerReconnectTokenSuccessMessage {
  type: typeof PT_MESSENGER_RECONNECT_TOKEN_SUCCESS;
  messageId: string;
  success: boolean;
}

export interface MessengerSocketErrorMessage {
  type: typeof PT_MESSENGER_SOCKET_ERROR;
  messageId: string;
  body: {
    error: string;
  };
}

export interface MessengerReadyMessage {
  type: typeof PT_MESSENGER_READY;
}

export interface MessengerAppleMerchantValidationMessage {
  type: typeof PT_MESSENGER_APPLE_MERCHANT_VALIDATION;
  messageId: string;
  body: {
    success: boolean;
    session?: unknown; // Apple Pay session object
    error?: string;
  };
}

export interface MessengerTransferCompleteMessage {
  type: typeof PT_MESSENGER_TRANSFER_COMPLETE;
  messageId: string;
  body: {
    success: boolean;
    transactionId?: string;
    error?: string;
  };
}

/**
 * Outgoing messages (Payment Components → Messenger)
 */

export interface MessengerEstablishChannelMessage {
  type: typeof PT_MESSENGER_ESTABLISH_CHANNEL;
  messageId: string;
}

export interface MessengerMerchantValidationMessage {
  type: typeof PT_MESSENGER_MERCHANT_VALIDATION;
  messageId: string;
}

export interface MessengerWalletTransactionMessage {
  type: typeof PT_MESSENGER_WALLET_TRANSACTION;
  messageId: string;
  data: {
    walletType: 'apple' | 'google';
    paymentToken: unknown;
    billingContact?: {
      givenName?: string;
      familyName?: string;
      addressLines?: string[];
      locality?: string;
      administrativeArea?: string;
      postalCode?: string;
      countryCode?: string;
    };
    shippingContact?: {
      givenName?: string;
      familyName?: string;
      addressLines?: string[];
      locality?: string;
      administrativeArea?: string;
      postalCode?: string;
      countryCode?: string;
    };
  };
}

export interface MessengerReconnectTokenMessage {
  type: typeof PT_MESSENGER_RECONNECT_TOKEN;
  messageId: string;
  data: {
    token: string;
  };
}

export interface MessengerPingMessage {
  type: typeof PT_MESSENGER_PING;
}
