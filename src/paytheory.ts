// ============= ENUMS =============

/**
 * Payment methods that can be accepted by the checkout
 */
export enum AcceptedPaymentMethods {
  ALL = 'ALL',
  NOT_ACH = 'NOT_ACH',
  NOT_CARD = 'NOT_CARD',
  NOT_CASH = 'NOT_CASH',
  ONLY_ACH = 'ONLY_ACH',
  ONLY_CARD = 'ONLY_CARD',
  ONLY_CASH = 'ONLY_CASH',
}

/**
 * Available button colors
 */
export enum ButtonColor {
  BLACK = 'BLACK',
  GREY = 'GREY',
  PURPLE = 'PURPLE',
  WHITE = 'WHITE',
}

/**
 * Call to action text for buttons
 */
export enum CallToAction {
  BOOK = 'BOOK',
  CHECKOUT = 'CHECKOUT',
  DONATE = 'DONATE',
  PAY = 'PAY',
}

/**
 * Error types that can be returned by the SDK
 */
export enum ErrorType {
  ACTION_COMPLETE = 'ACTION_COMPLETE',
  ACTION_IN_PROGRESS = 'ACTION_IN_PROGRESS',
  CANCEL_FAILED = 'CANCEL_FAILED',
  FIELD_ERROR = 'FIELD_ERROR',
  INVALID_PARAM = 'INVALID_PARAM',
  NO_FIELDS = 'NO_FIELDS',
  NOT_READY = 'NOT_READY',
  NOT_VALID = 'NOT_VALID',
  NO_TOKEN = 'NO_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SOCKET_ERROR = 'SOCKET_ERROR',
  TRANSACTING_FIELD_ERROR = 'TRANSACTING_FIELD_ERROR',
}

/**
 * Current fee modes for transactions
 */
export const enum FEE_MODE {
  MERCHANT_FEE = 'merchant_fee',
  SERVICE_FEE = 'service_fee',
}

/**
 * Types of health expenses
 */
export enum HealthExpenseType {
  CLINICAL = 'CLINICAL',
  COPAY = 'COPAY',
  DENTAL = 'DENTAL',
  HEALTHCARE = 'HEALTHCARE',
  RX = 'RX',
  TRANSIT = 'TRANSIT',
  VISION = 'VISION',
}

/**
 * Response message types returned by various PayTheory operations
 */
export enum ResponseMessageTypes {
  CASH = 'CASH',
  CONFIRMATION = 'CONFIRMATION',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  READY = 'READY',
  SUCCESS = 'SUCCESS',
  TOKENIZED = 'TOKENIZED',
}

/**
 * Tax indicator types for Level 3 processing
 */
export enum TaxIndicatorType {
  NO_TAX_INFO_PROVIDED = 'NO_TAX_INFO_PROVIDED',
  NOT_TAXABLE = 'NOT_TAXABLE',
  TAX_AMOUNT_PROVIDED = 'TAX_AMOUNT_PROVIDED',
}

/** @deprecated Use FEE_MODE.MERCHANT_FEE instead */
export const SURCHARGE: FEE_MODE.MERCHANT_FEE = FEE_MODE.MERCHANT_FEE;
/** @deprecated Use FEE_MODE.MERCHANT_FEE instead */
export const INTERCHANGE: FEE_MODE.MERCHANT_FEE = FEE_MODE.MERCHANT_FEE;

// ============= GENERAL TYPES =============

/**
 * Address object for customer information
 */
export interface AddressObject {
  city?: string; // City of the address
  country?: string; // Country of the address
  line1?: string; // First line of the address
  line2?: string; // Second line of the address
  postal_code?: string; // Postal code of the address
  region?: string; // Region of the address
}

/**
 * Billing information for customer. This can be used to bypass using the Card Hosted Fields to capture billing information.
 */
export interface BillingInfo {
  address?: AddressObject; // Address tied to the payment method
  name?: string; // Name on the payment method
}

/**
 * Style for the button
 */
export interface ButtonStyle {
  color: ButtonColor; // Color of the button
  callToAction: CallToAction; // Call to action for the button
  pill: boolean; // Whether the button is a pill shape
  height: number; // Height of the button
}

/**
 * State information for a payment field
 */
export interface FieldState {
  /** Whether the field currently has user focus */
  isFocused: boolean;
  /** Whether the field contains any input */
  isDirty: boolean;
  /** Array of validation error messages */
  errorMessages: string[];
}

/**
 * All fee modes including deprecated ones
 * @deprecated Use FEE_MODE instead
 */
export type FeeModeWithLegacy = FEE_MODE | 'merchant_fee' /* SURCHARGE/INTERCHANGE */;

/**
 * Level 3 data summary for transactions
 */
export interface Level3DataSummary {
  dest_postal_code?: string; // Destination postal code
  discnt_amt?: number; // Discount amount
  duty_amt?: number; // Duty amount
  frght_amt?: number; // Freight amount
  order_num?: string; // Order number
  prod_desc?: string[]; // Product description
  purch_idfr?: string; // Purchase ID
  tax_amt?: number; // Tax amount
  tax_ind?: TaxIndicatorType; // Tax indicator
}

/**
 * All possible payment field types in the PayTheory SDK
 */
export type PaymentFieldType =
  // Card Payment Fields
  | 'card-number'
  | 'card-cvv'
  | 'card-exp'
  | 'card-name'
  // Billing Address Fields
  | 'billing-line1'
  | 'billing-line2'
  | 'billing-city'
  | 'billing-state'
  | 'billing-zip'
  // Bank Payment Fields
  | 'account-name'
  | 'account-type'
  | 'account-number'
  | 'routing-number'
  | 'institution-number'
  | 'transit-number'
  // Cash Payment Fields
  | 'cash-name'
  | 'cash-contact';

/**
 * Payor information for customer
 */
export interface PayorInfo {
  email?: string; // Email address of the payor
  first_name?: string; // First name of the payor
  last_name?: string; // Last name of the payor
  personal_address?: AddressObject; // Personal address of the payor
  phone?: string; // Phone number of the payor
}

/**
 * Service fee information
 */
export interface ServiceFeeState {
  /** Total transaction amount in cents */
  amount?: number;
  /** Service fee in cents for card transactions (undefined if not calculated or no amount) */
  card_fee?: number;
  /** Service fee in cents for bank transactions (undefined if not calculated or no amount) */
  bank_fee?: number;
  /** Service fee in cents for ACH transactions (undefined if not calculated or no amount) */
  ach_fee?: number;
}

/**
 * Complete state object for all payment fields and service fees
 */
export type StateObject = Record<PaymentFieldType, FieldState> & {
  service_fee: ServiceFeeState;
};

/**
 * Style object for payment fields
 */
export interface StyleObject {
  default: object; // Default style for all payment fields
  success: object; // Style for valid payment fields
  error: object; // Style for invalid payment fields
  radio?: {
    // Style for radio buttons for Bank Account Type
    width: number; // Width of the radio button
    fill: string; // Fill color of the radio button
    stroke: string; // Stroke color of the radio button
    text: {
      fontSize: string; // Font size of the radio button text
      color: string; // Color of the radio button text
    };
  };
  hidePlaceholder?: boolean; // Whether to hide placeholder text for payment fields
}

// ============= RESPONSE TYPES =============

/**
 * Cash barcode object
 */
export interface CashBarcodeObject {
  barcodeUrl: string; // The URL for the cash barcode SVG
  mapUrl: string; // The URL for the cash barcode map
}

/**
 * Response for a cash barcode request
 */
export interface CashBarcodeResponse {
  body: CashBarcodeObject;
  type: ResponseMessageTypes.CASH;
}

/**
 * Confirmation object for a transaction
 */
export interface ConfirmationObject {
  amount: number; // Amount in cents for the transaction
  brand: string; // Brand of the payment method
  first_six: string; // First six digits of the payment method
  last_four: string; // Last four digits of the payment method
  receipt_number: string; // Transaction ID for the transaction
  service_fee: number; // Service fee in cents for the transaction
}

/**
 * Response for a confirmation request
 */
export interface ConfirmationResponse {
  body: ConfirmationObject;
  type: ResponseMessageTypes.CONFIRMATION;
}

/**
 * Error response object
 */
export interface ErrorResponse {
  error: string;
  type: ResponseMessageTypes.ERROR;
}

/**
 * Failed transaction object
 */
export interface FailedTransactionObject {
  brand: string; // Brand of the payment method
  last_four: string; // Last four digits of the payment method
  payor_id: string; // Unique identifier for the customer
  reason: {
    failure_code: string; // Code for the failure
    failure_text: string; // Text for the failure
  };
  receipt_number: string; // Transaction ID for the transaction
  state: string; // State of the transaction
  type: string; // Type of the transaction
}

/**
 * Response for a failed transaction
 */
export interface FailedTransactionResponse {
  body: FailedTransactionObject;
  type: ResponseMessageTypes.FAILED;
}

/**
 * Response for a ready request
 */
export interface ReadyResponse {
  body: true;
  type: ResponseMessageTypes.READY;
}

/**
 * Successful transaction object
 */
export interface SuccessfulTransactionObject {
  amount: number; // Amount in cents for the transaction
  brand: string; // Brand of the payment method
  created_at: string; // Date and time of the transaction
  last_four: string; // Last four digits of the payment method
  metadata: Record<string | number, string | number | boolean>; // Additional metadata for the transaction
  payment_method_id: string; // Unique identifier for the payment method
  payor_id: string; // Unique identifier for the customer
  receipt_number: string; // Transaction ID for the transaction
  service_fee: number; // Service fee in cents for the transaction
  state: string; // State of the transaction
  tags: Record<string | number, string | number | boolean>; // Additional tags for the transaction
}

/**
 * Response for a successful transaction
 */
export interface SuccessfulTransactionResponse {
  body: SuccessfulTransactionObject;
  type: ResponseMessageTypes.SUCCESS;
}

/**
 * Tokenized payment method object
 */
export interface TokenizedPaymentMethodObject {
  brand: string; // Brand of the payment method
  expiration: string; // Expiration date of the payment method
  last_four: string; // Last four digits of the payment method
  metadata: Record<string | number, string | number | boolean>; // Additional metadata for the payment method
  payment_method_id: string; // Unique identifier for the payment method
  payment_type: 'card' | 'ach'; // Type of the payment method
  payor_id: string; // Unique identifier for the customer
}

/**
 * Response for a tokenized payment method
 */
export interface TokenizedPaymentMethodResponse {
  body: TokenizedPaymentMethodObject;
  type: ResponseMessageTypes.TOKENIZED;
}

// ============= INPUT PROPS =============

export interface CheckoutDetails {
  acceptedPaymentMethods?: AcceptedPaymentMethods; // Payment methods accepted by the checkout
  accountCode?: string; // Account code that will be passed to the transaction
  amount: number; // Amount in cents for the checkout
  callToAction?: CallToAction; // Call to action for the checkout
  feeMode?: FEE_MODE; // Fee mode for the checkout
  healthExpenseType?: HealthExpenseType; // Type of health expense for the checkout
  invoiceId?: string; // Invoice ID for the invoice being paid for in the checkout page
  level3DataSummary?: Level3DataSummary; // Level 3 processing data for the checkout
  metadata?: Record<string | number, string | number | boolean>; // Additional metadata for the transaction
  paymentDescription?: string; // Description that will be displayed on the checkout page
  paymentName: string; // Name that will be displayed on the checkout page
  paymentParameters?: string; // @deprecated - Payment parameters for the checkout. This is not used for anything.
  payorId?: string; // Unique identifier for the customer that will be passed to the transaction
  recurringId?: string; // ID for recurring payment that is being paid for in the checkout page
  requirePhone?: boolean; // Whether to require the customer's phone number
}

/**
 * Parameters for creating a payment button
 * @example
 * ```typescript
 * paytheory.button({
 *   apiKey: 'YOUR_API_KEY',
 *   checkoutDetails: { ... },
 *   style: { ... },
 *   onReady: (ready) => { ... },
 *   onClick: () => { ... },
 *   onError: (error) => { ... },
 *   onCancel: () => { ... },
 *   onSuccess: (result) => { ... },
 *   onBarcode: (result) => { ... }
 * })
 * ```
 */
export interface PayTheoryButtonInput {
  apiKey: string; // Your PayTheory API key
  checkoutDetails: CheckoutDetails; // Details for the checkout
  style?: ButtonStyle; // Style for the button
  onReady?: (ready: true) => void; // Callback for when the button is ready
  onClick?: () => void; // Callback for when the button is clicked
  onError?: (error: string) => void; // Callback for when an error occurs
  onCancel?: () => void; // Callback for when the button is canceled
  onSuccess?: (result: SuccessfulTransactionObject) => void; // Callback for when the transaction is successful
  onBarcode?: (result: CashBarcodeObject) => void; // Callback for when the barcode is generated
}

/**
 * Parameters for initializing PayTheory payment fields
 * @example
 * ```typescript
 * paytheory.payTheoryFields({
 *   apiKey: 'YOUR_API_KEY'
 * })
 * ```
 */
export interface PayTheoryPaymentFieldsInput {
  /** Transaction amount in cents */
  amount?: number;
  /** Your PayTheory API key */
  apiKey: string;
  /** Country code for the transaction */
  country?: string;
  /** Custom placeholder text for the payment fields */
  placeholders?: Partial<Record<PaymentFieldType, string>>;
  /** Custom styles for the payment fields */
  styles?: StyleObject;
  /** @deprecated - Custom element IDs for the payment fields */
  elementIds?: Record<string, string>;
  /** @deprecated - Fee mode for the transaction. This is needed internally for when the create method is called */
  feeMode?: FEE_MODE;
  /** @deprecated - Additional metadata to be passed with the transaction */
  metadata?: Record<string | number, string | number | boolean>;
  /** Internal use - connects button/QR to hosted checkout. Will not work if used outside of PayTheory checkout pages */
  session?: string;
}

/**
 * Parameters for creating a payment QR code
 * @example
 * ```typescript
 * paytheory.qrCode({
 *   apiKey: 'YOUR_API_KEY',
 *   checkoutDetails: { ... },
 *   size: 200,
 *   onReady: (ready) => { ... },
 *   onError: (error) => { ... },
 *   onSuccess: (result) => { ... }
 * })
 * ```
 */
export interface PayTheoryQRInput {
  apiKey: string; // Your PayTheory API key
  checkoutDetails: CheckoutDetails; // Details for the checkout
  size?: number; // Size of the QR code
  onReady?: (ready: true) => void; // Callback for when the QR code is ready
  onError?: (error: string) => void; // Callback for when an error occurs
  onSuccess?: (result: SuccessfulTransactionObject) => void; // Callback for when the transaction is successful
}

/**
 * Parameters for tokenizing a payment method for future use
 * @example
 * ```typescript
 * const result = await paytheory.tokenizePaymentMethod({
 *   payorId: 'CUSTOMER_ID'
 * })
 * ```
 */
export interface TokenizeProps {
  /** Customer information */
  payorInfo?: PayorInfo;
  /** Unique identifier for the customer */
  payorId?: string;
  /** Additional metadata for the token */
  metadata?: Record<string | number, string | number | boolean>;
  /** Billing information */
  billingInfo?: BillingInfo;
  /** Whether to skip validation on the server. Only recommended for flows where the token is immediately used for an authorization or transaction */
  skipValidation?: boolean;
}

/**
 * Parameters for processing a payment transaction
 * @example
 * ```typescript
 * const result = await paytheory.transact({
 *   amount: 1000 // Amount in cents
 * })
 * ```
 */
export interface TransactProps {
  /** Account code for the transaction */
  accountCode?: string;
  /** Amount in cents */
  amount: number;
  /** Billing information */
  billingInfo?: BillingInfo;
  /** Whether to require confirmation */
  confirmation?: boolean;
  /** Fee mode for the transaction */
  feeMode?: FEE_MODE;
  /** Custom fee amount */
  fee?: number;
  /** Type of health expense */
  healthExpenseType?: HealthExpenseType;
  /** Invoice ID */
  invoiceId?: string;
  /** Level 3 processing data */
  level3DataSummary?: Level3DataSummary;
  /** Additional metadata for the transaction */
  metadata?: Record<string | number, string | number | boolean>;
  /** Whether the payment method can only be used once */
  oneTimeUseToken?: boolean;
  /** Payment parameters */
  paymentParameters?: string;
  /** Customer information */
  payorInfo?: PayorInfo;
  /** Unique identifier for the customer */
  payorId?: string;
  /** Description for the receipt */
  receiptDescription?: string;
  /** Reference number for the transaction */
  reference?: string;
  /** ID for recurring payment */
  recurringId?: string;
  /** Whether to send a receipt */
  sendReceipt?: boolean;
}

declare global {
  interface Window {
    paytheory: PayTheory;
  }
}

export interface PayTheory {
  /**
   * Initialize Pay Theory payment fields
   * @param options Configuration options for the payment fields
   * @returns Promise resolving to a ready response or error
   * @example
   * ```typescript
   * await paytheory.payTheoryFields({
   *   apiKey: 'YOUR_API_KEY'
   * })
   * ```
   */
  payTheoryFields: (options: PayTheoryPaymentFieldsInput) => Promise<ReadyResponse | ErrorResponse>;

  /**
   * Process a payment transaction
   * @param props Transaction parameters
   * @returns Promise resolving to a transaction response
   * @example
   * ```typescript
   * const result = await paytheory.transact({
   *   amount: 1000 // Amount in cents
   * })
   * ```
   */
  transact: (
    props: TransactProps,
  ) => Promise<
    | SuccessfulTransactionResponse
    | FailedTransactionResponse
    | CashBarcodeResponse
    | ConfirmationResponse
    | ErrorResponse
  >;

  /**
   * Confirm a payment transaction
   */
  confirm: () => Promise<SuccessfulTransactionObject | FailedTransactionObject | ErrorResponse>;

  /**
   * Cancel a payment transaction
   */
  cancel: () => Promise<true | ErrorResponse>;

  /**
   * Tokenize a payment method for future use
   */
  tokenizePaymentMethod: (
    props: TokenizeProps,
  ) => Promise<TokenizedPaymentMethodResponse | ErrorResponse>;

  /**
   * Update the transaction amount
   */
  updateAmount: (amount: number) => void;

  /**
   * Create a payment button that can be used to open a hosted checkout
   */
  button: (options: PayTheoryButtonInput) => void;

  /**
   * Create a payment QR code that can be used to open a hosted checkout
   */
  qrCode: (options: PayTheoryQRInput) => void;

  // Event Observers
  /**
   * Set up an observer for payment field validation
   * @param callback Function called when validation state changes
   * @example
   * ```typescript
   * paytheory.validObserver(isValid => {
   *   if (isValid) {
   *     // Fields are valid, enable submit button
   *   }
   * })
   * ```
   */
  validObserver: (callback: (isValid: boolean) => void) => void;
  /**
   * Set up an observer for payment field errors
   * @param callback Function called when an error occurs
   * @example
   * ```typescript
   * paytheory.errorObserver(error => {
   *   // Handle error
   * })
   * ```
   */
  errorObserver: (callback: (error: string) => void) => void;
  /**
   * Set up an observer for the payment field state
   */
  stateObserver: (callback: (state: StateObject) => void) => void;
  /**
   * Set up an observer for the payment field ready state
   */
  readyObserver: (callback: (isReady: boolean) => void) => void;

  // Constants
  // Fee modes
  readonly MERCHANT_FEE: FEE_MODE.MERCHANT_FEE;
  readonly SERVICE_FEE: FEE_MODE.SERVICE_FEE;
  // Accepted payment methods
  readonly ALL: AcceptedPaymentMethods.ALL;
  readonly NOT_ACH: AcceptedPaymentMethods.NOT_ACH;
  readonly NOT_CARD: AcceptedPaymentMethods.NOT_CARD;
  readonly NOT_CASH: AcceptedPaymentMethods.NOT_CASH;
  readonly ONLY_ACH: AcceptedPaymentMethods.ONLY_ACH;
  readonly ONLY_CARD: AcceptedPaymentMethods.ONLY_CARD;
  readonly ONLY_CASH: AcceptedPaymentMethods.ONLY_CASH;
  // Call to action
  readonly BOOK: CallToAction.BOOK;
  readonly CHECKOUT: CallToAction.CHECKOUT;
  readonly DONATE: CallToAction.DONATE;
  readonly PAY: CallToAction.PAY;
  // Button colors
  readonly BLACK: ButtonColor.BLACK;
  readonly GREY: ButtonColor.GREY;
  readonly PURPLE: ButtonColor.PURPLE;
  readonly WHITE: ButtonColor.WHITE;

  // Deprecated methods
  // Deprecated initialization methods
  /**
   * @deprecated Use payTheoryFields instead. This method will be removed in a future version.
   */
  createPaymentFields: (
    apiKey: string,
    clientId?: string,
    styles?: StyleObject,
    metadata?: Record<string | number, string | number | boolean>,
  ) => void;

  /**
   * @deprecated Use payTheoryFields instead. This method will be removed in a future version.
   */
  create: (
    apiKey: string,
    styles?: StyleObject,
    metadata?: Record<string | number, string | number | boolean>,
    feeMode?: string,
  ) => void;

  // Deprecated event observers
  /**
   * @deprecated The transact function now returns a Promise that resolves to a transaction response.
   */
  transactedObserver: (
    callback: (result: SuccessfulTransactionObject | FailedTransactionObject) => void,
  ) => void;
  /**
   * @deprecated The tokenizePaymentMethod function now returns a Promise that resolves to a tokenized payment method response.
   */
  tokenizeObserver: (callback: (result: TokenizedPaymentMethodObject) => void) => void;
  /**
   * @deprecated The capture function now returns a Promise that resolves to a confirmation response.
   */
  captureObserver: (callback: (result: ConfirmationObject) => void) => void;
  /**
   * @deprecated The transact function now returns a Promise that resolves to a cash barcode response.
   */
  cashObserver: (callback: (result: CashBarcodeObject) => void) => void;

  // Deprecated constants
  /** @deprecated Use MERCHANT_FEE instead */
  /** @deprecated Use MERCHANT_FEE instead */
  readonly SURCHARGE: typeof SURCHARGE;
  /** @deprecated Use MERCHANT_FEE instead */
  readonly INTERCHANGE: typeof INTERCHANGE;
}
