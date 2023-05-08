import {findTransactingElement} from "../common/dom";
import common from "../common";
import {MERCHANT_FEE} from "../common/data";
import * as valid from "./validation";
import {TokenizeDataObject, TransactDataObject} from "../components/pay-theory-hosted-field-transactional";
import {TokenizeProps, TransactProps} from "../common/format";

export const transact = async (props: TransactProps): Promise<any> => {
    let transactingElement = findTransactingElement()
    if(transactingElement) {
        if(!transactingElement.initialized) {
            // Setting to true so that the transact function can't be called again until the transaction is complete
            transactingElement.initialized = true
            let newProps = common.parseInputParams(props)
            // @ts-ignore Adding line for backwards compatibility
            let {payorInfo, customerInfo, shippingDetails} = newProps
            newProps.payorInfo = payorInfo || customerInfo || shippingDetails || {}
            // @ts-ignore Adding line for backwards compatibility
            newProps.feeMode = newProps.feeMode === 'interchange' ? MERCHANT_FEE : newProps.feeMode
            let validity = valid.validTransactionParams(newProps)
            if (validity) {
                return common.handleError('INVALID_TRANSACTION_PARAMS: The transaction params are invalid')
            }
            let {amount, payTheoryData, metadata = {}, feeMode, confirmation = false} = newProps
            let formattedPayor = valid.formatPayorObject(newProps.payorInfo ?? {})

            try {
                const data: TransactDataObject = {
                    amount,
                    payorInfo: formattedPayor,
                    payTheoryData: payTheoryData!,
                    metadata,
                    fee_mode: feeMode,
                    confirmation
                }
                let response = await transactingElement.transact(data, transactingElement)
                // TODO: Add logic to check what type the response is and return the appropriate data
                return response
            } catch (e) {
                // TODO: Add error handling
                return e
            }
        }
    } else {
        return common.handleError('NO_TRANSACTING_ELEMENT: There is no transacting element on the DOM to transact')
    }
}

export const confirm = async () => {
    let transactingElement = findTransactingElement()
    if(transactingElement) {
        try {
            let response = await transactingElement.capture()
            // TODO: Add logic to check what type the response is and return the appropriate data
            return response
        } catch (e) {
            // TODO: Add error handling
            return e
        }
    }
}

export const cancel = async () => {
    let transactingElement = findTransactingElement()
    if(transactingElement) {
        try {
            await transactingElement.cancel()
            return true
        } catch (e) {
            // TODO: Add error handling
            return e
        }
    }
}

export const tokenizePaymentMethod = async (props: TokenizeProps) => {
    let transactingElement = findTransactingElement()
    if(transactingElement) {
        if(!transactingElement.initialized) {
            transactingElement.initialized = true
            let {payorInfo = {}, payorId, metadata = {}} = props
            //validate the input param types
            if(!valid.isValidTokenizeParams(payorInfo, metadata)) {
                return false
            }
            //validate the payorInfo
            if(!valid.isValidPayorInfo(payorInfo)) {
                return false
            }
            // validate the payorId
            if(!valid.isValidPayorDetails(payorInfo, payorId)) {
                return false
            }
            const formattedPayor = valid.formatPayorObject(payorInfo)
            try {
                const data: TokenizeDataObject = {payorInfo: formattedPayor, metadata, payorId}
                return await transactingElement.tokenize(data, transactingElement)
            } catch (e) {
                // TODO: Add error handling
                return e
            }

        } else {
            return common.handleError('TRANSACTION_ALREADY_INITIALIZED: The transaction has already been initialized')
        }
    } else {
        return common.handleError('NO_TRANSACTING_ELEMENT: There is no transacting element on the DOM to transact')
    }
}
