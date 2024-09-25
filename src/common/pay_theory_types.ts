/* eslint-disable no-unused-vars */
/* noinspection JSUnusedGlobalSymbols */

import { defaultElementIds, ElementTypes, MERCHANT_FEE, SERVICE_FEE } from './data';

export enum ResponseMessageTypes {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  CONFIRMATION = 'CONFIRMATION',
  FAILED = 'FAILED',
  CASH = 'CASH',
  TOKENIZED = 'TOKENIZED',
  READY = 'READY',
}

export interface AddressObject {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface PayorInfo {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  personal_address?: AddressObject;
}

export interface BillingInfo {
  name?: string;
  address?: AddressObject;
}

export interface ConfirmationObject {
  first_six: string;
  last_four: string;
  brand: string;
  receipt_number: string;
  amount: number;
  service_fee: number;
}

export interface ConfirmationResponse {
  type: ResponseMessageTypes.CONFIRMATION;
  body: ConfirmationObject;
}

export interface SuccessfulTransactionObject {
  receipt_number: string;
  last_four: string;
  brand: string;
  created_at: string;
  amount: number;
  service_fee: number;
  state: string;
  // Keeping tags in the response for backwards compatibility
  tags: Record<string | number, string | number | boolean>;
  metadata: Record<string | number, string | number | boolean>;
  payor_id: string;
  payment_method_id: string;
}

export interface SuccessfulTransactionResponse {
  type: ResponseMessageTypes.SUCCESS;
  body: SuccessfulTransactionObject;
}

export interface ReadyResponse {
  type: ResponseMessageTypes.READY;
  body: true;
}

export interface FailedTransactionObject {
  receipt_number: string;
  last_four: string;
  brand: string;
  state: string;
  type: string;
  payor_id: string;
  reason: {
    failure_code: string;
    failure_text: string;
  };
}

export interface FailedTransactionResponse {
  type: ResponseMessageTypes.FAILED;
  body: FailedTransactionObject;
}

export interface CashBarcodeObject {
  barcodeUrl: string;
  mapUrl: string;
}

export interface CashBarcodeResponse {
  type: ResponseMessageTypes.CASH;
  body: CashBarcodeObject;
}

export interface TokenizedPaymentMethodObject {
  payment_method_id: string;
  payor_id: string;
  last_four: string;
  brand: string;
  expiration: string;
  payment_type: 'card' | 'ach';
  metadata: Record<string | number, string | number | boolean>;
}

export interface TokenizedPaymentMethodResponse {
  type: ResponseMessageTypes.TOKENIZED;
  body: TokenizedPaymentMethodObject;
}

// Error Types
export enum ErrorType {
  NO_FIELDS = 'NO_FIELDS',
  NOT_VALID = 'NOT_VALID',
  INVALID_PARAM = 'INVALID_PARAM',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NO_TOKEN = 'NO_TOKEN',
  FIELD_ERROR = 'FIELD_ERROR',
  CANCEL_FAILED = 'CANCEL_FAILED',
  ACTION_COMPLETE = 'ACTION_COMPLETE',
  ACTION_IN_PROGRESS = 'ACTION_IN_PROGRESS',
  TRANSACTING_FIELD_ERROR = 'TRANSACTING_FIELD_ERROR',
  SOCKET_ERROR = 'SOCKET_ERROR',
  NOT_READY = 'NOT_READY',
}

export interface ErrorResponse {
  type: ResponseMessageTypes.ERROR;
  error: string;
}

// Function Prop Types
export interface TokenizeProps {
  payorInfo?: PayorInfo;
  payorId?: string;
  metadata?: Record<string | number, string | number | boolean>;
  billingInfo?: BillingInfo;
}

export interface TransactProps {
  amount: number;
  payorInfo?: PayorInfo;
  billingInfo?: BillingInfo;
  payorId?: string;
  metadata?: Record<string | number, string | number | boolean>;
  feeMode?: typeof MERCHANT_FEE | typeof SERVICE_FEE;
  fee?: number;
  confirmation?: boolean;
  accountCode?: string;
  reference?: string;
  paymentParameters?: string;
  invoiceId?: string;
  sendReceipt?: boolean;
  receiptDescription?: string;
  recurringId?: string;
  healthExpenseType?: HealthExpenseType;
  level3DataSummary?: Level3DataSummary;
  oneTimeUseToken?: boolean;
}

export interface PayTheoryPaymentFieldsInput {
  apiKey: string;
  styles?: StyleObject;
  metadata?: Record<string | number, string | number | boolean>;
  placeholders?: PlaceholderObject;
  elementIds?: typeof defaultElementIds;
  session?: string; // This is used for internal use to connect a button and qr code to a hosted checkout page
  feeMode?: typeof MERCHANT_FEE | typeof SERVICE_FEE;
  amount?: number;
  country?: string;
}

export enum AcceptedPaymentMethods {
  ALL = 'ALL',
  NOT_CASH = 'NOT_CASH',
  NOT_CARD = 'NOT_CARD',
  NOT_ACH = 'NOT_ACH',
  ONLY_CASH = 'ONLY_CASH',
  ONLY_CARD = 'ONLY_CARD',
  ONLY_ACH = 'ONLY_ACH',
}

export enum CallToAction {
  PAY = 'PAY',
  DONATE = 'DONATE',
  BOOK = 'BOOK',
  CHECKOUT = 'CHECKOUT',
}

export enum ButtonColor {
  PURPLE = 'PURPLE',
  WHITE = 'WHITE',
  BLACK = 'BLACK',
  GREY = 'GREY',
}

export interface CheckoutDetails {
  amount: number;
  paymentName: string;
  paymentDescription?: string;
  requirePhone?: boolean;
  callToAction?: CallToAction;
  acceptedPaymentMethods?: AcceptedPaymentMethods;
  payorId?: string;
  metadata?: Record<string | number, string | number | boolean>;
  feeMode?: typeof MERCHANT_FEE | typeof SERVICE_FEE;
  accountCode?: string;
  paymentParameters?: string;
  invoiceId?: string;
  recurringId?: string;
  healthExpenseType?: HealthExpenseType;
  level3DataSummary?: Level3DataSummary;
}

export interface PayTheoryQRInput {
  apiKey: string;
  checkoutDetails: CheckoutDetails;
  size?: number;
  onReady?: (ready: true) => void;
  onError?: (error: string) => void;
  onSuccess?: (result: SuccessfulTransactionObject) => void;
}

export interface ButtonStyle {
  color: ButtonColor;
  callToAction: CallToAction;
  pill: boolean;
  height: number;
}

export interface PayTheoryButtonInput {
  apiKey: string;
  checkoutDetails: CheckoutDetails;
  style?: ButtonStyle;
  onReady?: (ready: true) => void;
  onClick?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onSuccess?: (result: SuccessfulTransactionObject) => void;
  onBarcode?: (result: CashBarcodeObject) => void;
}

export interface FieldState {
  isFocused: boolean;
  isDirty: boolean;
  errorMessages: string[];
}

export type StateObject = Record<ElementTypes, FieldState> &
  Record<
    'service_fee',
    { amount?: number; ach_fee?: number; card_fee?: number; bank_fee?: number }
  >;

export type PlaceholderObject = Partial<Record<ElementTypes, string>>;

export interface StyleObject {
  default: object;
  success: object;
  error: object;
  radio?: {
    width: number;
    fill: string;
    stroke: string;
    text: {
      fontSize: string;
      color: string;
    };
  };
  hidePlaceholder?: boolean;
}

export interface Level3DataSummary {
  tax_amt?: number;
  tax_ind?: TaxIndicatorType;
  purch_idfr?: string;
  order_num?: string;
  discnt_amt?: number;
  frght_amt?: number;
  duty_amt?: number;
  dest_postal_code?: string;
  prod_desc?: string[];
}

export enum TaxIndicatorType {
  TAX_AMOUNT_PROVIDED = 'TAX_AMOUNT_PROVIDED',
  NOT_TAXABLE = 'NOT_TAXABLE',
  NO_TAX_INFO_PROVIDED = 'NO_TAX_INFO_PROVIDED',
}

export enum HealthExpenseType {
  HEALTHCARE = 'HEALTHCARE',
  RX = 'RX',
  VISION = 'VISION',
  CLINICAL = 'CLINICAL',
  COPAY = 'COPAY',
  DENTAL = 'DENTAL',
  TRANSIT = 'TRANSIT',
}
