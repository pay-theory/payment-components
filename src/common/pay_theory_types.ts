import { defaultElementIds, ElementTypes, MERCHANT_FEE, SERVICE_FEE } from "./data";

export enum ResponseMessageTypes {
    SUCCESS = "SUCCESS",
    ERROR = "ERROR",
    CONFIRMATION = "CONFIRMATION",
    FAILED = "FAILED",
    CASH = "CASH",
    TOKENIZED = "TOKENIZED",
    READY = "READY",
}

export type AddressObject = {
    line1?: string,
    line2?: string,
    city?: string,
    region?: string,
    postal_code?: string,
    country?: string
}

export type PayorInfo = {
    first_name?: string,
    last_name?: string,
    email?: string,
    phone?: string,
    personal_address?: AddressObject
}

export type BillingInfo = {
    name?: string,
    address?: AddressObject
}

export type ConfirmationObject = {
    first_six: string,
    last_four: string,
    brand: string,
    receipt_number: string,
    amount: number,
    service_fee: number
}

export type ConfirmationResponse = {
    type: ResponseMessageTypes.CONFIRMATION,
    body: ConfirmationObject
}

export type SuccessfulTransactionObject = {
    receipt_number: string,
    last_four: string,
    brand: string,
    created_at: string,
    amount: number,
    service_fee: number,
    state: string,
    // Keeping tags in the response for backwards compatibility
    tags: {[keys: string | number]: string | number | boolean },
    metadata: {[keys: string | number]: string | number | boolean },
    payor_id: string,
    payment_method_id: string
}

export type SuccessfulTransactionResponse = {
    type: ResponseMessageTypes.SUCCESS,
    body: SuccessfulTransactionObject
}

export type ReadyResponse = {
    type: ResponseMessageTypes.READY,
    body: true
}

export type FailedTransactionObject = {
    receipt_number: string,
    last_four: string,
    brand: string,
    state: string,
    type: string,
    payor_id: string,
    reason: {
        failure_code: string,
        failure_text: string
    }
}

export type FailedTransactionResponse = {
    type: ResponseMessageTypes.FAILED,
    body: FailedTransactionObject
}

export type CashBarcodeObject = {
    barcodeUrl: string,
    mapUrl: string,
}

export type CashBarcodeResponse = {
    type: ResponseMessageTypes.CASH,
    body: CashBarcodeObject
}

export type TokenizedPaymentMethodObject = {
    payment_method_id: string,
    payor_id: string,
    last_four: string,
    brand: string,
    expiration: string,
    payment_type: "card" | "ach",
    metadata: {[keys: string | number]: string | number | boolean }
}

export type TokenizedPaymentMethodResponse = {
    type: ResponseMessageTypes.TOKENIZED,
    body: TokenizedPaymentMethodObject
}

// Error Types
export enum ErrorType {
    NO_FIELDS = "NO_FIELDS",
    NOT_VALID = "NOT_VALID",
    INVALID_PARAM = "INVALID_PARAM",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    NO_TOKEN = "NO_TOKEN",
    FIELD_ERROR = "FIELD_ERROR",
    CANCEL_FAILED = "CANCEL_FAILED",
    ACTION_COMPLETE = "ACTION_COMPLETE",
    ACTION_IN_PROGRESS = "ACTION_IN_PROGRESS",
    TRANSACTING_FIELD_ERROR = "TRANSACTING_FIELD_ERROR",
    SOCKET_ERROR = "SOCKET_ERROR",
    NOT_READY = "NOT_READY"
}

export type ErrorResponse = {
    type: ResponseMessageTypes.ERROR,
    error: string
}

// Function Prop Types
export type TokenizeProps = {
    payorInfo?: PayorInfo,
    payorId?: string,
    metadata?: {[keys: string | number]: string | number | boolean },
    billingInfo?: BillingInfo,
}

export type TransactProps = {
    amount: number,
    payorInfo?: PayorInfo,
    billingInfo?: BillingInfo,
    payorId?: string,
    metadata?: {[keys: string | number]: string | number | boolean },
    feeMode?: typeof MERCHANT_FEE | typeof SERVICE_FEE,
    fee?: number,
    confirmation?: boolean,
    accountCode?: string
    reference?: string,
    paymentParameters?: string,
    invoiceId?: string,
    sendReceipt?: boolean,
    receiptDescription?: string,
    recurringId?: string,
    healthExpenseType?: HealthExpenseType,
    level3DataSummary?: Level3DataSummary
}

export type PayTheoryPaymentFieldsInput = {
    apiKey: string;
    styles?: StyleObject;
    metadata?: { [key: string | number]: string | number | boolean };
    placeholders?: PlaceholderObject;
    elementIds?: typeof defaultElementIds;
    session?: string;
    feeMode?: typeof MERCHANT_FEE | typeof SERVICE_FEE;
}

export enum AcceptedPaymentMethods {
    ALL = "ALL",
    NOT_CASH = "NOT_CASH",
    NOT_CARD = "NOT_CARD",
    NOT_ACH = "NOT_ACH",
    ONLY_CASH = "ONLY_CASH",
    ONLY_CARD = "ONLY_CARD",
    ONLY_ACH = "ONLY_ACH"
}

export enum CallToAction {
    PAY = "PAY",
    DONATE = "DONATE",
    BOOK = "BOOK",
    CHECKOUT = "CHECKOUT"
}

export enum ButtonColor {
    PURPLE = "PURPLE",
    WHITE = "WHITE",
    BLACK = "BLACK",
    GREY = "GREY",
}

export type CheckoutDetails = {
    amount: number,
    paymentName: string,
    paymentDescription?: string,
    requirePhone?: boolean,
    callToAction?: CallToAction,
    acceptedPaymentMethods?: AcceptedPaymentMethods,
    payorId?: string,
    metadata?: {[keys: string | number]: string | number | boolean },
    feeMode?: typeof MERCHANT_FEE | typeof SERVICE_FEE,
    accountCode?: string,
    paymentParameters?: string,
    invoiceId?: string,
    recurringId?: string,
    healthExpenseType?: HealthExpenseType,
    level3DataSummary?: Level3DataSummary
}

export type PayTheoryQRInput = {
    apiKey: string,
    checkoutDetails: CheckoutDetails,
    size: number,
    onReady: (ready: true) => void,
    onError: (error: string) => void,
    onSuccess: (result: SuccessfulTransactionObject) => void
}

export type ButtonStyle = {
    color: ButtonColor,
    callToAction: CallToAction,
    pill: boolean,
    height: number,
}

export type PayTheoryButtonInput = {
    apiKey: string,
    checkoutDetails: CheckoutDetails,
    style: ButtonStyle,
    onReady: (ready: true) => void,
    onClick: () => void,
    onError: (error: string) => void,
    onCancel: () => void,
    onSuccess: (result: SuccessfulTransactionObject) => void,
    onBarcode: (result: CashBarcodeObject) => void
}



export type FieldState = {
    isFocused: boolean
    isDirty: boolean
    errorMessages: string[]
}

export type StateObject = Record<ElementTypes, FieldState>

export type PlaceholderObject = Partial<Record<ElementTypes, string>>

export type StyleObject = {
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
        }
    }
    hidePlaceholder?: boolean;
}

export interface Level3DataSummary {
    tax_amt: number;
    tax_ind: TaxIndicatorType;
    purch_idfr: string;
    order_num: string;
    discnt_amt: number;
    frght_amt: number;
    duty_amt: number;
    dest_postal_code: string;
    prod_desc: string[];
}

enum TaxIndicatorType {
    TAX_AMOUNT_PROVIDED = "TAX_AMOUNT_PROVIDED",
    NOT_TAXABLE = "NOT_TAXABLE",
    NO_TAX_INFO_PROVIDED = "NO_TAX_INFO_PROVIDED"
}

export enum HealthExpenseType {
    HEALTHCARE = "HEALTHCARE",
    RX = "RX",
    VISION = "VISION",
    CLINICAL = "CLINICAL",
    COPAY = "COPAY",
    DENTAL = "DENTAL",
    TRANSIT = "TRANSIT"
}

