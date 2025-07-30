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
  PT_WALLET_TYPES,
} from './constants';

import { ResponseMessageTypes, Transaction } from '../common/pay_theory_types';

// Function Response
export interface MessengerResponse {
  success: boolean;
  error?: string;
}

// Apple Pay session response
export interface ApplePaySessionResponse {
  type: ResponseMessageTypes.SUCCESS;
  session: any;
}

// Transaction response
export interface TransactionResponse {
  type: ResponseMessageTypes.SUCCESS;
  transaction: Transaction;
}

// Wallet transaction payload
export interface WalletTransactionPayload {
  amount: number;
  digitalWalletPayload: any;
  walletType: PT_WALLET_TYPES;
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

export interface WalletTransactionPayloadServer {
  amount: number;
  digital_wallet_payload: any;
  wallet_type: PT_WALLET_TYPES;
  payor?: any;
  reference?: string;
  account_code?: string;
  metadata?: any;
  additional_purchase_data?: any;
  billing_address?: any;
  fee?: number;
  health_expense_type?: string;
  invoice_id?: string;
  receipt_description?: string;
  payor_id?: string;
  recurring_id?: string;
  send_receipt?: boolean;
  split?: any;
  timezone: string;
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
    transaction: Transaction;
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
    walletType: PT_WALLET_TYPES;
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
