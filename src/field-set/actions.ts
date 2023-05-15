import {findTransactingElement} from "../common/dom";
import common from "../common";
import {MERCHANT_FEE} from "../common/data";
import * as valid from "./validation";
import {TokenizeDataObject, TransactDataObject} from "../components/pay-theory-hosted-field-transactional";
import {
    CASH_MESSAGE,
    CashBarcodeResponse,
    ConfirmationResponse,
    ErrorResponse,
    ErrorType,
    FailedTransactionResponse,
    SuccessfulTransactionResponse, TokenizedPaymentMethodResponse,
    TokenizeProps,
    TransactProps
} from "../common/pay_theory_types";
import {localizeCashBarcodeUrl, parseResponse} from "../common/format";
import {sendObserverMessage} from "../common/message";

export const transact = async (props: TransactProps): Promise<ErrorResponse | ConfirmationResponse | SuccessfulTransactionResponse | FailedTransactionResponse | CashBarcodeResponse> => {
    let transactingElement = findTransactingElement()
    if(transactingElement) {
        if(transactingElement.initialized) {
            return common.handleTypedError(ErrorType.ALREADY_INITIALIZED, 'this function has already been called')
        } else if(transactingElement.valid == false) {
            return common.handleTypedError(ErrorType.NOT_VALID, "The transaction element is invalid")
        } else {
            // Setting to true so that the transact function can't be called again until the transaction is complete
            transactingElement.initialized = true
            let newProps = common.parseInputParams(props)
            let {payorInfo, customerInfo, shippingDetails} = newProps
            newProps.payorInfo = payorInfo || customerInfo || shippingDetails || {}
            // @ts-ignore Adding line for backwards compatibility
            newProps.feeMode = newProps.feeMode === 'interchange' || !newProps.feeMode ? MERCHANT_FEE : newProps.feeMode
            // Check for validity of the transaction parameters
            let validity = valid.validTransactionParams(newProps)
            if (validity) return validity
            let {amount, payTheoryData, metadata = {}, feeMode, confirmation = false} = newProps
            let formattedPayor = valid.formatPayorObject(newProps.payorInfo ?? {})

            try {
                const data: TransactDataObject = {
                    amount,
                    payorInfo: formattedPayor,
                    payTheoryData: payTheoryData,
                    metadata,
                    fee_mode: feeMode,
                    confirmation
                }
                const response = await transactingElement.transact(data, transactingElement)
                let parsedResponse = parseResponse(response) as ErrorResponse | ConfirmationResponse | SuccessfulTransactionResponse | FailedTransactionResponse | CashBarcodeResponse
                if(parsedResponse.type === CASH_MESSAGE) {
                    parsedResponse = await localizeCashBarcodeUrl(parsedResponse)
                }
                sendObserverMessage(parsedResponse)
                return parsedResponse
            } catch (e) {
                return common.handleError(e?.error || e?.message || e)
            }
        }
    } else {
        return common.handleTypedError(ErrorType.TRANSACTING_FIELD_ERROR, "No transacting fields found")
    }
}

export const confirm = async (): Promise<ErrorResponse | SuccessfulTransactionResponse | FailedTransactionResponse> => {
    let transactingElement = findTransactingElement()
    if(transactingElement) {
        try {
            let response = await transactingElement.capture()
            const parsedResult = parseResponse(response) as ErrorResponse | SuccessfulTransactionResponse | FailedTransactionResponse
            sendObserverMessage(parsedResult)
            return parsedResult
        } catch (e) {
            return common.handleError(e?.error || e?.message || e)
        }
    } else {
        return common.handleTypedError(ErrorType.TRANSACTING_FIELD_ERROR, "No transacting fields found")
    }
}

export const cancel = async (): Promise<true | ErrorResponse> => {
    let transactingElement = findTransactingElement()
    if(transactingElement) {
        try {
            return await transactingElement.cancel()
        } catch (e) {
            return common.handleError(e?.error || e?.message || e)
        }
    }
}

export const tokenizePaymentMethod = async (props: TokenizeProps): Promise<TokenizedPaymentMethodResponse | ErrorResponse> => {
    let transactingElement = findTransactingElement()
    if(transactingElement) {
        if(transactingElement.initialized) {
            return common.handleTypedError(ErrorType.ALREADY_INITIALIZED, 'this function has already been called')
        } else if(transactingElement.valid == false) {
            return common.handleTypedError(ErrorType.NOT_VALID, "The transaction element is invalid")
        } else  {
            transactingElement.initialized = true
            let {payorInfo = {}, payorId, metadata = {}, billingInfo} = props
            //validate the input param types
            let error = valid.isValidTokenizeParams(payorInfo, metadata)
            if (error) return error
            //validate the payorInfo
            error = valid.isValidPayorInfo(payorInfo)
            if (error) return error
            // validate the payorId
            error = valid.isValidPayorDetails(payorInfo, payorId)
            if(error) return error
            // validate the billingInfo
            error = valid.isValidBillingInfo(billingInfo)
            if(error) return error
            const formattedPayor = valid.formatPayorObject(payorInfo)
            try {
                const data: TokenizeDataObject = {payorInfo: formattedPayor, metadata, payorId, billingInfo}
                let result = await transactingElement.tokenize(data, transactingElement)
                let parsedResult = parseResponse(result)
                sendObserverMessage(parsedResult)
                return parsedResult as TokenizedPaymentMethodResponse | ErrorResponse
            } catch (e) {
                return common.handleError(e?.error || e?.message || e)
            }

        }
    } else {
        return common.handleTypedError(ErrorType.TRANSACTING_FIELD_ERROR, "No transacting fields found")
    }
}

export const activateCardPresentDevice = async (): Promise<ErrorResponse | true> => {
    return true
}
