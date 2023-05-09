import {defaultElementIds, ElementTypes, MERCHANT_FEE, SERVICE_FEE} from "./data";


// Message Types coming back from the Hosted Fields
export const SUCCESS_MESSAGE = "SUCCESS"
export const ERROR_MESSAGE = "ERROR"
export const CONFIRMATION_MESSAGE = "CONFIRMATION"
export const FAILED_MESSAGE = "FAILED"
export const CASH_MESSAGE = "CASH"
export const TOKENIZED_MESSAGE = "TOKENIZED"

export type AddressObject = {
    line1: string,
    line2: string,
    city: string,
    region: string,
    postal_code: string,
    country: string
}

export type PayorInfo = {
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    personal_address: AddressObject,
    billing_address: AddressObject
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
    type: typeof CONFIRMATION_MESSAGE,
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
    type: typeof SUCCESS_MESSAGE,
    body: SuccessfulTransactionObject
}

export type FailedTransactionObject = {
    receipt_number: string,
    last_four: string,
    brand: string,
    state: string,
    type: string,
    payor_id: string
}

export type FailedTransactionResponse = {
    type: typeof FAILED_MESSAGE,
    body: FailedTransactionObject
}

export type CashBarcodeObject = {
    barcodeUrl: string,
    mapUrl: string,
}

export type CashBarcodeResponse = {
    type: typeof CASH_MESSAGE,
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
    type: typeof TOKENIZED_MESSAGE,
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
    ALREADY_INITIALIZED = "ALREADY_INITIALIZED",
    TRANSACTING_FIELD_ERROR = "TRANSACTING_FIELD_ERROR",
    SOCKET_ERROR = "SOCKET_ERROR"
}

export type ErrorResponse = {
    type: typeof ERROR_MESSAGE,
    error: string
}

// Function Prop Types
export type TokenizeProps = {
    payorInfo?: PayorInfo,
    payorId?: string,
    metadata?: {[keys: string | number]: string | number | boolean },
}

export type TransactProps = {
    amount: number,
    payorInfo?: PayorInfo,
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
    recurringId?: string
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