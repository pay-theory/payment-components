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

import { ResponseMessageTypes } from '../common/pay_theory_types';

export enum FeeMode {
  CUSTOM_FEE = 'CUSTOM_FEE',
  INTERCHANGE = 'INTERCHANGE',
  MERCHANT_FEE = 'MERCHANT_FEE',
  SERVICE_FEE = 'SERVICE_FEE',
}

export enum TransactionStatus {
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED',
  RETURNED = 'RETURNED',
  SETTLED = 'SETTLED',
  SUCCEEDED = 'SUCCEEDED',
  VOIDED = 'VOIDED',
}

export enum TransactionType {
  ACH_RETURN = 'ACH_RETURN',
  DEBIT = 'DEBIT',
  FAILURE = 'FAILURE',
  REVERSAL = 'REVERSAL',
}

export enum TransactionReviewStatus {
  EXCEEDS_AUTH = 'EXCEEDS_AUTH',
  EXCEEDS_FEE_LIMIT = 'EXCEEDS_FEE_LIMIT',
  EXCEEDS_THRESHOLD = 'EXCEEDS_THRESHOLD',
  POTENTIAL_DUPLICATE = 'POTENTIAL_DUPLICATE',
}

export enum PaymentType {
  ACH = 'ACH',
  CARD = 'CARD',
  CASH = 'CASH',
}

export enum CardType {
  BUSINESS_CREDIT = 'BUSINESS_CREDIT',
  BUSINESS_DEBIT = 'BUSINESS_DEBIT',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PREPAID_CARD = 'PREPAID_CARD',
}

export enum BankAccountType {
  BUSINESS_CHECKING = 'BUSINESS_CHECKING',
  BUSINESS_SAVINGS = 'BUSINESS_SAVINGS',
  PERSONAL_CHECKING = 'PERSONAL_CHECKING',
  PERSONAL_SAVINGS = 'PERSONAL_SAVINGS',
}

export enum ServerWalletType {
  APPLE_PAY = 'APPLE_PAY',
  CLICK_TO_PAY = 'CLICK_TO_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  SAMSUNG_PAY = 'SAMSUNG_PAY',
  VISA_STAGED = 'VISA_STAGED',
}

export interface Payor {
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  full_name: string;
  merchant_uid: string;
  payor_id: string;
  phone: string | null;
  postal_code: string | null;
  region: string | null;
}

export interface PaymentMethod {
  address_line1: string | null;
  address_line2: string | null;
  bank_account_type: BankAccountType | null;
  bank_code: string | null;
  barcode_id: string | null;
  card_brand: string | null;
  card_type: CardType | null;
  city: string | null;
  country: string | null;
  exp_date: string | null;
  full_name: string;
  is_active: boolean;
  issuing_country_code: string | null;
  last_four: string | null;
  merchant_uid: string;
  payment_method_id: string;
  payment_type: PaymentType;
  payor: Payor;
  postal_code: string | null;
  region: string | null;
  wallet_type: ServerWalletType | null;
}

export interface Split {
  // Add split properties based on schema if needed
  [key: string]: any;
}

export interface Transaction {
  account_code: string | null;
  additional_purchase_data: any | null;
  authorization_id: string | null;
  avs_status: string | null;
  currency: string;
  device_id: string | null;
  failure_reasons: string[] | null;
  fee_mode: FeeMode;
  fees: number;
  flag_for_review: TransactionReviewStatus | null;
  gross_amount: number;
  merchant_uid: string;
  metadata: Record<string, any>;
  net_amount: number;
  parent_id: string | null;
  payment_method: PaymentMethod;
  payment_method_id: string;
  payor_id: string;
  recurring_id: string | null;
  reference: string | null;
  sale_id: string | null;
  splits: Split[] | null;
  status: TransactionStatus;
  transaction_date: string;
  transaction_id: string;
  transaction_type: TransactionType;
}

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
