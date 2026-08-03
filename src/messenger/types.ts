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

import type {
  ApplePayMerchantValidationBody,
  Transaction,
  WalletTransactionPayload,
  WalletType,
} from '../paytheory-sdk';

/** Internal snake_case payload sent from Messenger to the wallet transaction endpoint. */
export interface WalletTransactionPayloadServer {
  amount: WalletTransactionPayload['amount'];
  digital_wallet_payload: WalletTransactionPayload['digitalWalletPayload'];
  wallet_type: WalletTransactionPayload['walletType'];
  payor?: WalletTransactionPayload['payor'];
  reference?: WalletTransactionPayload['reference'];
  account_code?: WalletTransactionPayload['accountCode'];
  metadata?: WalletTransactionPayload['metadata'];
  additional_purchase_data?: WalletTransactionPayload['additionalPurchaseData'];
  billing_address?: WalletTransactionPayload['billingAddress'];
  fee?: WalletTransactionPayload['fee'];
  health_expense_type?: WalletTransactionPayload['healthExpenseType'];
  invoice_id?: WalletTransactionPayload['invoiceId'];
  receipt_description?: WalletTransactionPayload['receiptDescription'];
  payor_id?: WalletTransactionPayload['payorId'];
  recurring_id?: WalletTransactionPayload['recurringId'];
  send_receipt?: WalletTransactionPayload['sendReceipt'];
  split?: WalletTransactionPayload['split'];
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
  body: ApplePayMerchantValidationBody;
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

/** Internal iframe message carrying a provider-issued wallet payment token. */
export interface MessengerWalletTransactionMessage {
  type: typeof PT_MESSENGER_WALLET_TRANSACTION;
  messageId: string;
  data: {
    walletType: WalletType;
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
