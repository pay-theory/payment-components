import {MERCHANT_FEE, SERVICE_FEE} from "./data";
import * as data from "./data";

// Message Types that would come back from the iframe for async messages
export const CONFIRMATION_STEP = "confirmation-step"
export const ERROR = "error"
export const SUCCESSFUL_TRANSACTION = "successful-transaction"
export const FAILED_TRANSACTION = "failed-transaction"
export const CANCELLED_TRANSACTION = "cancelled-transaction"
export const CASH_BARCODE = "cash-barcode"
export const PAYMENT_METHOD_TOKENIZED = "payment-method-tokenized"
export type MessageType = typeof CONFIRMATION_STEP | typeof ERROR | typeof SUCCESSFUL_TRANSACTION | typeof FAILED_TRANSACTION | typeof CANCELLED_TRANSACTION | typeof CASH_BARCODE | typeof PAYMENT_METHOD_TOKENIZED

export type PayorInfo = {
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    personal_address: {
        line1: string,
        line2: string,
        city: string,
        region: string,
        postal_code: string,
        country: string
    }
}

export type PayTheoryDataObject = {
    account_code: string | number,
    reference: string | number
    payment_parameters: string,
    payor_id?: string,
    send_receipt?: boolean,
    receipt_description?: string,
    invoice_id?: string,
    recurring_id?: string,
    timezone?: string,
    fee?: number
}

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
    recurringId?: string,
    payTheoryData?: PayTheoryDataObject
}

export const parseInputParams = (inputParams: TransactProps) => {
    let { payorId, invoiceId, recurringId, fee, metadata = {} } = inputParams
    inputParams.payTheoryData = {
        account_code: inputParams.accountCode || metadata["pay-theory-account-code"] as string,
        reference: inputParams.reference || metadata["pay-theory-reference"] as string,
        payment_parameters: inputParams.paymentParameters || metadata["payment-parameters-name"] as string,
        payor_id: payorId,
        send_receipt: inputParams.sendReceipt || metadata["pay-theory-receipt"] as boolean,
        receipt_description: inputParams.receiptDescription || metadata["pay-theory-receipt-description"] as string,
        invoice_id: invoiceId,
        recurring_id: recurringId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        fee: fee
    }
    inputParams.metadata = metadata
    return inputParams
}

export type ConfirmationObject = {
    first_six: string,
    last_four: string,
    brand: string,
    receipt_number: string,
    amount: number,
    service_fee: number
}

export type ConfirmationMessage = {
    type: typeof CONFIRMATION_STEP
    body: {
        fee_mode: typeof MERCHANT_FEE | typeof SERVICE_FEE,
        first_six: string,
        last_four: string,
        brand: string,
        idempotency: string,
        amount: number,
        fee: number
    }
}

export const parseConfirmationMessage = (message: ConfirmationMessage): ConfirmationObject => {
        const fee = message.body.fee_mode === data.SERVICE_FEE ? message.body.fee : 0
        return {
            "first_six": message.body.first_six,
            "last_four": message.body.last_four,
            "brand": message.body.brand,
            "receipt_number": message.body.idempotency,
            "amount": message.body.amount,
            "service_fee": fee
        }
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

export type SuccessfulTransactionMessage = {
    type: typeof SUCCESSFUL_TRANSACTION
    body: {
        receipt_number: string,
        last_four: string,
        brand: string,
        created_at: string,
        amount: number,
        service_fee: number,
        state: string,
        metadata: {[keys: string | number]: string | number | boolean },
        payor_id: string,
        payment_method_id: string
    }
}

export const parseSuccessfulTransactionMessage = (message: SuccessfulTransactionMessage): SuccessfulTransactionObject => {
    return {
        "receipt_number": message.body.receipt_number,
        "last_four": message.body.last_four,
        "brand": message.body.brand,
        "created_at": message.body.created_at,
        "amount": message.body.amount,
        "service_fee": message.body.service_fee,
        "state": message.body.state,
        // Keeping tags in the response for backwards compatibility
        "tags": message.body.metadata,
        "metadata": message.body.metadata,
        "payor_id": message.body.payor_id,
        "payment_method_id": message.body.payment_method_id
    }
}

export type FailedTransactionObject = {
    receipt_number: string,
    last_four: string,
    brand: string,
    state: string,
    type: string,
    payor_id: string
}

export type FailedTransactionMessage = {
    type: typeof FAILED_TRANSACTION
    body: {
        receipt_number: string,
        last_four: string,
        brand: string,
        state: string,
        type: string,
        payor_id: string
    }
}

export const parseFailedTransactionMessage = (message: FailedTransactionMessage): FailedTransactionObject => {
    return {
        "receipt_number": message.body.receipt_number,
        "last_four": message.body.last_four,
        "brand": message.body.brand,
        "state": message.body.state,
        "type": message.body.type,
        "payor_id": message.body.payor_id,
    }
}

//TODO: Add type for cash barcode, errors, tokenization