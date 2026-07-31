/**
 * Public TypeScript contract for the Pay Theory browser SDK.
 *
 * This module intentionally contains no runtime implementation and no imports. Keeping the
 * public contract self-contained allows the declaration build to produce one downloadable file
 * that partners can either include globally or import types from locally.
 */

/** Primitive values accepted in SDK metadata. */
export type MetadataValue = string | number | boolean;

/** Partner-defined metadata sent with a payment or payment method. */
export type Metadata = Record<string | number, MetadataValue>;

/** Function returned by observers and event subscriptions to remove the listener. */
export type Unsubscribe = () => void;

/** Fee behavior accepted by payment requests. */
export type PaymentFeeMode = 'merchant_fee' | 'service_fee';

/** Countries currently supported by hosted payment fields. */
export type SupportedCountry = 'USA' | 'CAN';

/** Payment methods that a hosted checkout may offer. */
export type AcceptedPaymentMethod =
  'ALL' | 'NOT_CASH' | 'NOT_CARD' | 'NOT_ACH' | 'ONLY_CASH' | 'ONLY_CARD' | 'ONLY_ACH';

/** Call-to-action labels exposed by the SDK. */
export type CallToAction = 'PAY' | 'BOOK' | 'DONATE';

/** Button colors exposed by the browser SDK constants. */
export type ButtonColor = 'white' | 'grey' | 'black' | 'purple';

/** Discriminator used by all top-level SDK responses. */
export type ResponseMessageType =
  'SUCCESS' | 'ERROR' | 'CONFIRMATION' | 'FAILED' | 'CASH' | 'TOKENIZED' | 'READY';

/** Error categories that may prefix the human-readable SDK error string. */
export type ErrorType =
  | 'NO_FIELDS'
  | 'NOT_VALID'
  | 'INVALID_PARAM'
  | 'SESSION_EXPIRED'
  | 'NO_TOKEN'
  | 'FIELD_ERROR'
  | 'CANCEL_FAILED'
  | 'ACTION_COMPLETE'
  | 'ACTION_IN_PROGRESS'
  | 'TRANSACTING_FIELD_ERROR'
  | 'SOCKET_ERROR'
  | 'NOT_READY';

/** Postal address accepted for a payor or billing contact. */
export interface AddressObject {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

/** Identity and contact details supplied for a payor. */
export interface PayorInfo {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  personal_address?: AddressObject;
}

/** Billing name and address associated with a payment method. */
export interface BillingInfo {
  name?: string;
  address?: AddressObject;
}

/** Card details returned when a payment requires confirmation. */
export interface ConfirmationObject {
  first_six: string;
  last_four: string;
  brand: string;
  receipt_number: string;
  amount: number;
  service_fee: number;
}

/** Response returned when a payment is waiting for explicit confirmation. */
export interface ConfirmationResponse {
  type: 'CONFIRMATION';
  body: ConfirmationObject;
}

/** Compact transaction shape returned unless `expandedResponse` is requested. */
export interface SuccessfulTransactionObject {
  receipt_number: string;
  last_four: string;
  brand: string;
  created_at: string;
  amount: number;
  service_fee: number;
  state: string;
  /** @deprecated Use `metadata`; retained for backwards compatibility. */
  tags: Metadata;
  metadata: Metadata;
  payor_id: string;
  payment_method_id: string;
}

/** Compact failed-transaction shape returned by the SDK. */
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

/** Cash barcode and store-locator URLs returned for a cash payment. */
export interface CashBarcodeObject {
  barcodeUrl: string;
  mapUrl: string;
}

/** Compact payment-method shape returned unless `expandedResponse` is requested. */
export interface TokenizedPaymentMethodObject {
  payment_method_id: string;
  payor_id: string;
  last_four: string;
  brand: string;
  expiration: string;
  payment_type: 'card' | 'ach';
  metadata: Metadata;
}

/** SDK error response. The `error` string may begin with an {@link ErrorType}. */
export interface ErrorResponse {
  type: 'ERROR';
  error: string;
}

/** Response returned after hosted payment fields are ready. */
export interface ReadyResponse {
  type: 'READY';
  body: true;
}

/** Fee mode reported by an expanded server transaction. */
export type TransactionFeeMode = 'CUSTOM_FEE' | 'MERCHANT_FEE' | 'SERVICE_FEE';

/** Lifecycle status reported by an expanded server transaction. */
export type TransactionStatus =
  | 'CANCELED'
  | 'FAILED'
  | 'PARTIALLY_REFUNDED'
  | 'PENDING'
  | 'REFUNDED'
  | 'RETURNED'
  | 'SETTLED'
  | 'SUCCEEDED'
  | 'VOIDED';

/** Type reported by an expanded server transaction. */
export type TransactionType = 'ACH_RETURN' | 'DEBIT' | 'FAILURE' | 'REVERSAL';

/** Review flag reported by an expanded server transaction. */
export type TransactionReviewStatus =
  'EXCEEDS_AUTH' | 'EXCEEDS_FEE_LIMIT' | 'EXCEEDS_THRESHOLD' | 'POTENTIAL_DUPLICATE';

/** Payment rail reported by an expanded payment method. */
export type PaymentType = 'ACH' | 'CARD' | 'CASH';

/** Card funding type reported by an expanded payment method. */
export type CardType =
  'BUSINESS_CREDIT' | 'BUSINESS_DEBIT' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PREPAID_CARD';

/** Bank account type reported by an expanded payment method. */
export type BankAccountType =
  'BUSINESS_CHECKING' | 'BUSINESS_SAVINGS' | 'PERSONAL_CHECKING' | 'PERSONAL_SAVINGS';

/** Wallet provider reported by an expanded payment method. */
export type ServerWalletType =
  'APPLE_PAY' | 'CLICK_TO_PAY' | 'GOOGLE_PAY' | 'SAMSUNG_PAY' | 'VISA_STAGED';

/** Payor included in expanded server responses. */
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

/** Payment method included in expanded server responses. */
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

/** Processor-specific split data included in an expanded transaction. */
export type TransactionSplit = Record<string, unknown>;

/** Complete server transaction returned when `expandedResponse` is enabled. */
export interface Transaction {
  account_code: string | null;
  additional_purchase_data: unknown | null;
  authorization_id: string | null;
  avs_status: string | null;
  currency: string;
  device_id: string | null;
  failure_reasons: string[] | null;
  fee_mode: TransactionFeeMode;
  fees: number;
  flag_for_review: TransactionReviewStatus | null;
  gross_amount: number;
  merchant_uid: string;
  metadata: Record<string, unknown>;
  net_amount: number;
  parent_id: string | null;
  payment_method: PaymentMethod;
  payment_method_id: string;
  payor_id: string;
  recurring_id: string | null;
  reference: string | null;
  sale_id: string | null;
  splits: TransactionSplit[] | null;
  status: TransactionStatus;
  transaction_date: string;
  transaction_id: string;
  transaction_type: TransactionType;
}

/** Successful transaction response, compact by default or expanded on request. */
export interface SuccessfulTransactionResponse {
  type: 'SUCCESS';
  body: SuccessfulTransactionObject | Transaction;
}

/** Failed transaction response, compact by default or expanded on request. */
export interface FailedTransactionResponse {
  type: 'FAILED';
  body: FailedTransactionObject | Transaction;
}

/** Response returned for a cash barcode transaction. */
export interface CashBarcodeResponse {
  type: 'CASH';
  body: CashBarcodeObject;
}

/** Successful tokenization response, compact by default or expanded on request. */
export interface TokenizedPaymentMethodResponse {
  type: 'TOKENIZED';
  body: TokenizedPaymentMethodObject | PaymentMethod;
}

/** Every response that can be returned by `transact`. */
export type TransactResult =
  | ErrorResponse
  | ConfirmationResponse
  | SuccessfulTransactionResponse
  | FailedTransactionResponse
  | CashBarcodeResponse;

/** Every response that can be returned by `confirm`. */
export type ConfirmResult =
  ErrorResponse | SuccessfulTransactionResponse | FailedTransactionResponse;

/** Every response that can be returned by `tokenizePaymentMethod`. */
export type TokenizeResult = ErrorResponse | TokenizedPaymentMethodResponse;

/** Input accepted by `tokenizePaymentMethod`. Do not provide both `payorInfo` and `payorId`. */
export interface TokenizeProps {
  payorInfo?: PayorInfo;
  payorId?: string;
  metadata?: Metadata;
  billingInfo?: BillingInfo;
  skipValidation?: boolean;
  expandedResponse?: boolean;
}

/** Tax handling for Level 3 transaction data. */
export type TaxIndicatorType = 'TAX_AMOUNT_PROVIDED' | 'NOT_TAXABLE' | 'NO_TAX_INFO_PROVIDED';

/** Healthcare category accepted for eligible transactions. */
export type HealthExpenseType =
  'HEALTHCARE' | 'RX' | 'VISION' | 'CLINICAL' | 'COPAY' | 'DENTAL' | 'TRANSIT';

/** Level 3 summary fields accepted by a transaction. */
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

/**
 * Input accepted by `transact`.
 *
 * Amounts are integer cents. `payorInfo` and `payorId` are mutually exclusive, as are
 * `invoiceId` and `recurringId`; the SDK returns an error when both members of either pair are set.
 */
export interface TransactProps {
  amount: number;
  payorInfo?: PayorInfo;
  billingInfo?: BillingInfo;
  payorId?: string;
  metadata?: Metadata;
  feeMode?: PaymentFeeMode;
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
  expandedResponse?: boolean;
}

/** Hosted field names accepted by placeholder and state maps. */
export type HostedFieldType =
  | 'account-number'
  | 'account-name'
  | 'routing-number'
  | 'account-type'
  | 'credit-card'
  | 'card-number'
  | 'card-exp'
  | 'card-cvv'
  | 'card-name'
  | 'billing-line1'
  | 'billing-line2'
  | 'billing-city'
  | 'billing-state'
  | 'billing-zip'
  | 'cash-name'
  | 'cash-contact'
  | 'institution-number'
  | 'transit-number';

/** DOM container identifiers that can be overridden when mounting hosted fields. */
export interface PaymentFieldElementIds {
  'credit-card': string;
  number: string;
  exp: string;
  cvv: string;
  'account-name': string;
  'address-1': string;
  'address-2': string;
  city: string;
  state: string;
  zip: string;
  'account-number': string;
  'ach-name': string;
  'routing-number': string;
  'account-type': string;
  'bank-account-number': string;
  'bank-account-name': string;
  'bank-account-type': string;
  'bank-institution-number': string;
  'bank-transit-number': string;
  'cash-name': string;
  'cash-contact': string;
  'card-present': string;
}

/** Placeholder overrides keyed by hosted field name. */
export type PlaceholderObject = Partial<Record<HostedFieldType, string>>;

/** CSS-compatible value passed to hosted fields, including nested selectors such as placeholders. */
export type HostedFieldCssValue = string | number | HostedFieldCssProperties;

/** CSS-compatible style properties passed to hosted fields. */
export interface HostedFieldCssProperties {
  [property: string]: HostedFieldCssValue;
}

/** Visual styling applied to hosted payment fields. */
export interface StyleObject {
  default?: HostedFieldCssProperties;
  success?: HostedFieldCssProperties;
  error?: HostedFieldCssProperties;
  radio?: {
    width?: number;
    fill?: string;
    stroke?: string;
    text?: HostedFieldCssProperties;
  };
  hidePlaceholder?: boolean;
}

/** Input accepted by `payTheoryFields`. */
export interface PayTheoryPaymentFieldsInput {
  apiKey: string;
  styles?: StyleObject;
  metadata?: Metadata;
  placeholders?: PlaceholderObject;
  elementIds?: PaymentFieldElementIds;
  /** Session used to connect hosted controls to the same checkout flow. */
  session?: string;
  feeMode?: PaymentFeeMode;
  amount?: number;
  country?: SupportedCountry;
}

/** Hosted-checkout details shared by checkout buttons and QR codes. */
export interface CheckoutDetails {
  /** Amount in integer cents. */
  amount: number;
  paymentName: string;
  paymentDescription?: string;
  requirePhone?: boolean;
  callToAction?: CallToAction;
  acceptedPaymentMethods?: AcceptedPaymentMethod;
  payorId?: string;
  metadata?: Metadata;
  feeMode?: PaymentFeeMode;
  accountCode?: string;
  paymentParameters?: string;
  invoiceId?: string;
  recurringId?: string;
  healthExpenseType?: HealthExpenseType;
  level3DataSummary?: Level3DataSummary;
}

/** Input accepted by `qrCode`. QR sizes are clamped to the supported 128–300 pixel range. */
export interface PayTheoryQRInput {
  apiKey: string;
  checkoutDetails: CheckoutDetails;
  size?: number;
  onReady?: (ready: true) => void;
  onError?: (error: string) => void;
  onSuccess?: (result: SuccessfulTransactionObject) => void;
}

/** Visual configuration for a hosted checkout button. */
export interface ButtonStyle {
  color: ButtonColor;
  callToAction: CallToAction;
  pill: boolean;
  height: number;
}

/** Input and lifecycle callbacks accepted by `button`. */
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

/** Validation and interaction state for one hosted field. */
export interface FieldState {
  isFocused: boolean;
  isDirty: boolean;
  errorMessages: string[];
}

/** Fee details included with hosted-field state notifications. */
export interface ServiceFeeState {
  amount?: number;
  ach_fee?: number;
  card_fee?: number;
  bank_fee?: number;
}

/** State reported by `stateObserver`; only fields mounted on the page are present. */
export type StateObject = Partial<Record<HostedFieldType, FieldState>> & {
  service_fee: ServiceFeeState;
};

/** Options accepted when mounting fields through the legacy controller. */
export interface LegacyMountOptions {
  placeholders?: PlaceholderObject;
  elements?: PaymentFieldElementIds;
  session?: string;
}

/** Controller returned by the legacy `create` APIs. */
export interface PaymentFieldsController {
  /** Mounts the controller's fields into the configured DOM elements. */
  mount(options?: LegacyMountOptions): Promise<void>;
  /** @deprecated Use `transact` instead. */
  initTransaction(amount: number, payorInfo: PayorInfo, confirmation?: boolean): void;
  /** Starts a transaction using the mounted fields. */
  transact(props: TransactProps): Promise<TransactResult>;
  /** Tokenizes the payment method collected by the mounted fields. */
  tokenizePaymentMethod(props: TokenizeProps): Promise<TokenizeResult>;
  /** Activates the configured card-present device. */
  activateCardPresentDevice(): true | ErrorResponse;
  /** Confirms a transaction that previously required confirmation. */
  confirm(): Promise<ConfirmResult>;
  /** Cancels the active hosted-field action. */
  cancel(): Promise<true | ErrorResponse | void>;
  /** Observes hosted-field readiness. */
  readyObserver(callback: (ready: true) => void): Unsubscribe;
  /** Observes SDK errors. */
  errorObserver(callback: (error: string) => void): Unsubscribe;
  /** Observes legacy validity notifications. */
  validObserver(callback: (value: string) => void): Unsubscribe;
  /** Observes cash barcode results. */
  cashObserver(callback: (value: CashBarcodeObject) => void): Unsubscribe;
  /** Observes the final body emitted after confirming a transaction. */
  captureObserver(
    callback: (value: SuccessfulTransactionObject | FailedTransactionObject | Transaction) => void,
  ): Unsubscribe;
  /** Observes the card details emitted when a transaction requires confirmation. */
  tokenizeObserver(callback: (value: ConfirmationObject) => void): Unsubscribe;
  /** Observes completed transaction and tokenization bodies. */
  transactedObserver(
    callback: (
      value:
        | TokenizedPaymentMethodObject
        | PaymentMethod
        | SuccessfulTransactionObject
        | FailedTransactionObject
        | Transaction,
    ) => void,
  ): Unsubscribe;
  /** Observes hosted-field interaction and validation state. */
  stateObserver(callback: (value: StateObject) => void): Unsubscribe;
}

/** Wallet providers accepted by `PayTheoryMessenger`. */
export type WalletType = 'APPLE_PAY' | 'GOOGLE_PAY' | 'PAZE';

/** Wallet transaction request accepted by `PayTheoryMessenger`. */
export interface WalletTransactionPayload {
  /** Amount in integer cents. */
  amount: number;
  /** Provider-issued payload; its schema is owned by the selected wallet provider. */
  digitalWalletPayload: unknown;
  walletType: WalletType;
  payor?: Record<string, unknown>;
  reference?: string;
  accountCode?: string;
  metadata?: Record<string, unknown>;
  additionalPurchaseData?: unknown;
  billingAddress?: Record<string, unknown>;
  fee?: number;
  healthExpenseType?: HealthExpenseType;
  invoiceId?: string;
  receiptDescription?: string;
  payorId?: string;
  recurringId?: string;
  sendReceipt?: boolean;
  split?: TransactionSplit;
}

/** Result returned while initializing a Messenger connection. */
export interface MessengerResponse {
  success: boolean;
  error?: string;
}

/** Apple Pay merchant-validation body returned by the Messenger frame. */
export interface ApplePayMerchantValidationBody {
  success: boolean;
  session?: unknown;
  error?: string;
}

/** Successful Apple Pay merchant-validation response. */
export interface ApplePaySessionResponse {
  type: 'SUCCESS';
  /**
   * Messenger currently returns its validation response body under `session`.
   * Consumers should check `success` before reading the provider-owned session value.
   */
  session: ApplePayMerchantValidationBody;
}

/** Successful wallet transaction response. */
export interface TransactionResponse {
  type: 'SUCCESS';
  transaction: Transaction;
}

/** Payloads delivered by public Messenger events. */
export interface MessengerEventMap {
  ready: { success: true };
  transaction_complete: { transaction: Transaction };
  transaction_error: { error: string };
  iframe_unloaded: { timestamp: number };
}

/** Public event names accepted by `PayTheoryMessenger.on`. */
export type MessengerEvent = keyof MessengerEventMap;

/** Public wallet and event interface exposed by the browser SDK. */
export declare class PayTheoryMessenger {
  /** Wallet type constant used for Apple Pay requests. */
  static readonly applePay: 'APPLE_PAY';
  /** Wallet type constant used for Google Pay requests. */
  static readonly googlePay: 'GOOGLE_PAY';
  /** Wallet type constant used for Paze requests. */
  static readonly paze: 'PAZE';

  /** Creates a Messenger client for the supplied public API key. */
  constructor(options: { apiKey: string });

  /** Initializes the hidden Messenger frame and its secure channel. */
  initialize(): Promise<MessengerResponse>;

  /** Requests an Apple Pay merchant-validation session. */
  getApplePaySession(): Promise<ApplePaySessionResponse | ErrorResponse>;

  /** Processes a transaction using a provider-issued digital wallet payload. */
  processWalletTransaction(
    payload: WalletTransactionPayload,
  ): Promise<TransactionResponse | ErrorResponse>;

  /** Removes frames, channels, and event listeners owned by this instance. */
  destroy(): void;

  /** Subscribes to a documented Messenger event and returns an unsubscribe function. */
  on<TEvent extends MessengerEvent>(
    event: TEvent,
    callback: (payload: MessengerEventMap[TEvent]) => void,
  ): Unsubscribe;
}

/**
 * Complete partner-facing interface installed at `window.paytheory` by the browser bundle.
 *
 * The SDK remains a browser global; exported declarations in this file are types only.
 */
export interface PayTheorySDK {
  /** @deprecated Use `payTheoryFields` and the top-level action methods instead. */
  createPaymentFields(
    apiKey: string,
    clientId?: string,
    styles?: StyleObject,
    metadata?: Metadata,
  ): Promise<PaymentFieldsController>;

  /** Creates a legacy controller while preserving the current global SDK integration. */
  create(
    apiKey: string,
    styles?: StyleObject,
    metadata?: Metadata,
    feeMode?: PaymentFeeMode,
  ): Promise<PaymentFieldsController>;

  /** Creates a hosted checkout button in its configured DOM container. */
  button(input: PayTheoryButtonInput): Promise<void | false | ErrorResponse>;

  /** Creates a hosted checkout QR code in its configured DOM container. */
  qrCode(input: PayTheoryQRInput): Promise<void | false | ErrorResponse>;

  /** Mounts and initializes hosted payment fields. */
  payTheoryFields(input: PayTheoryPaymentFieldsInput): Promise<ReadyResponse | ErrorResponse>;

  /** Starts a transaction using the mounted hosted fields. */
  transact(props: TransactProps): Promise<TransactResult>;

  /** Confirms a transaction that previously returned a confirmation response. */
  confirm(): Promise<ConfirmResult>;

  /** Cancels the active hosted-field action. */
  cancel(): Promise<true | ErrorResponse | void>;

  /** Tokenizes the payment method collected by the mounted hosted fields. */
  tokenizePaymentMethod(props: TokenizeProps): Promise<TokenizeResult>;

  /** Updates the integer-cent amount on every mounted transacting field. */
  updateAmount(amount: number): Promise<true | ErrorResponse>;

  /** Observes SDK errors and returns a function that removes the observer. */
  errorObserver(callback: (error: string) => void): Unsubscribe;
  /** Observes completed transaction and tokenization bodies. */
  transactedObserver(
    callback: (
      value:
        | TokenizedPaymentMethodObject
        | PaymentMethod
        | SuccessfulTransactionObject
        | FailedTransactionObject
        | Transaction,
    ) => void,
  ): Unsubscribe;
  /** Observes the card details emitted when a transaction requires confirmation. */
  tokenizeObserver(callback: (value: ConfirmationObject) => void): Unsubscribe;
  /** Observes the final body emitted after confirming a transaction. */
  captureObserver(
    callback: (value: SuccessfulTransactionObject | FailedTransactionObject | Transaction) => void,
  ): Unsubscribe;
  /** Observes hosted-field interaction and validation state. */
  stateObserver(callback: (value: StateObject) => void): Unsubscribe;
  /** Observes legacy validity notifications. */
  validObserver(callback: (value: string) => void): Unsubscribe;
  /** Observes hosted-field readiness. */
  readyObserver(callback: (ready: true) => void): Unsubscribe;
  /** Observes cash barcode results. */
  cashObserver(callback: (value: CashBarcodeObject) => void): Unsubscribe;

  /** @deprecated Use `MERCHANT_FEE`; both constants resolve to `merchant_fee`. */
  readonly SURCHARGE: 'merchant_fee';
  /** Selects service-fee pricing. */
  readonly SERVICE_FEE: 'service_fee';
  /** @deprecated Use `MERCHANT_FEE`; both constants resolve to `merchant_fee`. */
  readonly INTERCHANGE: 'merchant_fee';
  /** Selects merchant-fee pricing. */
  readonly MERCHANT_FEE: 'merchant_fee';
  /** Allows every supported payment method. */
  readonly ALL: 'ALL';
  /** Allows every supported payment method except cash. */
  readonly NOT_CASH: 'NOT_CASH';
  /** Allows every supported payment method except card. */
  readonly NOT_CARD: 'NOT_CARD';
  /** Allows every supported payment method except ACH. */
  readonly NOT_ACH: 'NOT_ACH';
  /** Allows only cash payments. */
  readonly ONLY_CASH: 'ONLY_CASH';
  /** Allows only card payments. */
  readonly ONLY_CARD: 'ONLY_CARD';
  /** Allows only ACH payments. */
  readonly ONLY_ACH: 'ONLY_ACH';
  /** Selects the "Pay" hosted-checkout call to action. */
  readonly PAY: 'PAY';
  /** Selects the "Book" hosted-checkout call to action. */
  readonly BOOK: 'BOOK';
  /** Selects the "Donate" hosted-checkout call to action. */
  readonly DONATE: 'DONATE';
  /**
   * Exported legacy constant. Hosted checkout validation does not accept it as a call to action.
   */
  readonly CHECKOUT: 'CHECKOUT';
  /** Selects the white hosted-button color. */
  readonly WHITE: 'white';
  /** Selects the grey hosted-button color. */
  readonly GREY: 'grey';
  /** Selects the black hosted-button color. */
  readonly BLACK: 'black';
  /** Selects the purple hosted-button color. */
  readonly PURPLE: 'purple';
  /** Public constructor for wallet transactions and Messenger events. */
  readonly PayTheoryMessenger: typeof PayTheoryMessenger;
}

declare global {
  interface Window {
    /** Pay Theory browser SDK installed by the payment-components script. */
    paytheory: PayTheorySDK;

    /** Public Messenger constructor also exposed as a backwards-compatible top-level global. */
    PayTheoryMessenger: typeof PayTheoryMessenger;
  }
}
