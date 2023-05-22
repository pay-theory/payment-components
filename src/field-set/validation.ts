/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import common from '../common'
import {handleTypedError} from "../common/message";
import PayTheoryHostedField from "../components/pay-theory-hosted-field";
import {ErrorResponse, ErrorType, PayorInfo} from "../common/pay_theory_types";
import {ModifiedCheckoutDetails, ModifiedTransactProps} from "../common/format";
import {ElementTypes} from "../common/data";

const findField = (type: ElementTypes) => (element: PayTheoryHostedField | false, currentElement: PayTheoryHostedField) => {
    return element ? element : currentElement.field === type ? currentElement : false
}

const findCVV = findField('card-cvv')
const findExp = findField('card-exp')
const findAccountNumber = findField('account-number')
const findBankCode = findField('routing-number')
const findAccountType = findField('account-type')
const findAccountName = findField('account-name')
const findZip = findField('billing-zip')

// partner mode is used to indicate migration builds
const checkApiKey = (key: any) => {
    if (!validate(key, 'string')) {
        throw Error(`Valid API Key not found. Please provide a valid API Key`)
    }
    const keyParts = key.split("-")
    let environment = keyParts[0]
    let stage = keyParts[1]
    let partnerMode = ""
    if (['new', 'old'].includes(stage)) {
        partnerMode = stage
        stage = keyParts[2]
    }

    if(environment !== common.PARTNER || stage !== common.STAGE) {
        throw Error(`Valid API Key not found. Please provide a valid API Key`)
    }
}

const validate = (value: any, type: string) => {
    return typeof value === type && value
}

const checkFeeMode = (mode: string) => {
    if (!validate(mode, 'string') || ![common.MERCHANT_FEE, common.SERVICE_FEE].includes(mode)) {
        console.error(`Fee Mode should be either 'merchant_fee' or 'service_fee' which are also available as constants at window.paytheory.MERCHANT_FEE and window.paytheory.SERVICE_FEE`)
    }
}

const checkMetadata = (metadata: any) => {
    if (!validate(metadata, 'object')) {
        throw Error(`Metadata should be a JSON Object`)
    }
}

const checkStyles = (styles: any) => {
    if (!validate(styles, 'object')) {
        throw Error(`Styles should be a JSON Object. An example of the object is at https://github.com/pay-theory/payment-components`)
    }
}

const checkEnv = (env: any) => {
    if (!validate(env, 'string')) {
        throw Error(`Environment not found in api key`)
    }
}
const VALID_STAGES = ['paytheory', 'paytheorylab', 'paytheorystudy']
const checkStage = (stage: string) => {
    if (!VALID_STAGES.includes(stage)) {
        throw Error(`Stage variable not found in api key`)
    }
}

const checkInitialParams = (key: any, mode: any, metadata: any, styles: any) => {
    checkApiKey(key)
    checkFeeMode(mode)
    checkMetadata(metadata)
    checkStyles(styles)
}

// Checks the dom for elements and returns errors if there are missing elements or conflicting elements
const findCardNumberError = (processedElements: PayTheoryHostedField[]): false | string => {
    if (processedElements.reduce(findExp, false) === false) {
        return  'missing credit card expiration field required for payments'
    }

    if(processedElements.reduce(findCVV, false) === false) {
        return  'missing CVV field required for payments'
    }

    if (document.getElementById(`pay-theory-credit-card`)) {
        return 'credit card element is not allowed when using credit card number'
    }
    return false
}

const findCombinedCardError = (processedElements: PayTheoryHostedField[]) => {
    if (processedElements.reduce(findExp, false)) {
        return  'expiration is not allowed when using combined credit card'
    }

    if(processedElements.reduce(findCVV, false)) {
        return  'CVV is not allowed when using combined credit card'
    }

    if (document.getElementById(`pay-theory-credit-card-number`)) {
        return  'credit card number is not allowed when using combined credit card'
    }
    return false
}

const achCheck = [{
    check: findAccountName,
    error: 'missing ACH account name field required for payments'
}, {
    check: findAccountNumber,
    error: 'missing ACH account number field required for payments'
}, {
    check: findAccountType,
    error: 'missing ACH account type field required for payments'
}, {
    check: findBankCode,
    error: 'missing ACH routing number field required for payments'
}, ]

const findAchError = (processedElements: PayTheoryHostedField[]): string | false => {
    if (processedElements.length === 0) {
        return false
    }

    // @ts-ignore
    achCheck.forEach(obj => {
        if (processedElements.reduce(obj.check, false) === false) {
            return obj.error
        }
    })

    return false
}

const findCardError = (processedElements: PayTheoryHostedField[], transacting: PayTheoryHostedField[]) => {
    let error: false | string = false
    if (processedElements.length === 0) {
        return error
    }

    if (transacting.length === 0) {
        error = 'missing credit card entry field required for payments'
    }
    else if (transacting[0].id === 'pay-theory-credit-card-number-tag-frame') {
        error = findCardNumberError(processedElements)
    }
    else {
        error = findCombinedCardError(processedElements)
    }
    return error
}

const findCashError = (processedElements: PayTheoryHostedField[]): string | false => {
    let error: string | false = false
    if (processedElements.length === 0) {
        return error
    }

    if (processedElements.reduce(findField('cash-name'), false) === false) {
        error = 'missing Cash name field required for payments'
    }

    if (processedElements.reduce(findField('cash-contact'), false) === false) {
        error = 'missing Cash Contact info field required for payments'
    }

    return error
}

const findCardPresentError = (processedElements: PayTheoryHostedField[]): string | false => {
    if (processedElements.length === 0) {
        return false
    }
    // @ts-ignore
    if (processedElements.reduce(findField('card-present'), false) === false) {
        return 'missing Card Present field required for payments'
    }

    return false
}

const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
}

const validatePhone = (phone: string) => {
    // strip out all non-numeric characters
    const stripped = phone.replace(/\D/g, '')
    // check if the number is between 5 and 15 digits
    return stripped.length >= 5 && stripped.length <= 15
}

type payorInfo = {
    same_as_billing?: boolean,
    email?: string,
    phone?: string
    first_name?: string,
    last_name?: string,
    personal_address?: {
        line1?: string,
        line2?: string,
        city?: string,
        region?: string,
        postal_code?: string,
        country?: string
    }
}

const isValidPayorInfo = (payorInfo: payorInfo): ErrorResponse | null => {
    if (!validate(payorInfo, 'object')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'payor_info is not an object')
    }
    if(payorInfo.same_as_billing === true) {
        const allowedKeys = ['same_as_billing', 'email', 'phone']
        const keys = Object.keys(payorInfo)
        for (let key of keys) {
            if (!allowedKeys.includes(key)) {
                return handleTypedError(ErrorType.INVALID_PARAM, `if payor_info is same_as_billing, only the following keys are allowed: ${allowedKeys.join(', ')}`)
            }
        }
    }
    if(payorInfo.email) {
        if (!validate(payorInfo.email, 'string')) {
            return handleTypedError(ErrorType.INVALID_PARAM, 'payor_info.email is not a string')
        }
        if (!validateEmail(payorInfo.email)) {
            return handleTypedError(ErrorType.INVALID_PARAM, 'payor_info.email is not a valid email')
        }
    }
    if(payorInfo.phone) {
        if (!validate(payorInfo.phone, 'string')) {
            return handleTypedError(ErrorType.INVALID_PARAM, 'payor_info.phone is not a string')
        }
        if (!validatePhone(payorInfo.phone)) {
            return handleTypedError(ErrorType.INVALID_PARAM, 'payor_info.phone is not a valid phone number')
        }
    }
    return null
}

const nullifyEmptyStrings = (params: object) => {
    let newParams = JSON.parse(JSON.stringify(params));
    Object.keys(newParams).forEach((key) => {
        if (newParams[key as keyof typeof newParams] === "") {
            // @ts-ignore
            newParams[key as keyof typeof newParams] = null;
        } else if (typeof newParams[key as keyof typeof newParams] === "object") {
            nullifyEmptyStrings(newParams[key as keyof typeof newParams]);
        }
    });
    return newParams;
}

const formatPayorObject = (payorInfo: payorInfo): PayorInfo => {
    // Make a deep copy of the payorInfo object
    let payorCopy = JSON.parse(JSON.stringify(payorInfo))
    // Nullify any empty strings
    payorCopy = nullifyEmptyStrings(payorCopy)
    // Strip out any non-numeric characters from the phone number
    if (payorCopy.phone) {
        payorCopy.phone = payorCopy.phone.replace(/\D/g, '')
    }
    return payorCopy
}

const isvalidTransactParams = (amount: any, payorInfo: any, metadata: any): ErrorResponse | null => {
    //Make sure that we have the base required settings
    if (!validate(amount, 'number') || !validate(metadata, 'object') || !validate(payorInfo, 'object')) {
        const missing = `${!validate(amount, 'number') ? 'amount ' : ''}${!validate(metadata, 'object') ? 'metadata ' : ''}${!validate(payorInfo, 'object') ? 'payorInfo ' : ''}`
        return handleTypedError(ErrorType.INVALID_PARAM, 'Some required fields are missing or invalid: ' + missing)
    }
    if (amount <= 0) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'amount must be a positive integer')
    }
    return null
}

const isValidTokenizeParams = (payorInfo: any, metadata: any): ErrorResponse | null => {
    //Make sure that we have the base required settings
    if (!validate(metadata, 'object') || !validate(payorInfo, 'object')) {
        const missing = `${!validate(metadata, 'object') ? 'metadata ' : ''}${!validate(payorInfo, 'object') ? 'payorInfo ' : ''}`
        return handleTypedError(ErrorType.INVALID_PARAM, 'Some required fields are missing or invalid: ' + missing)
    }
    return null
}

const isValidAmount = (amount: any): ErrorResponse | null => {
    if (!validate(amount, 'number')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'amount must be a positive integer')
    }
    return null
}

const isValidDeviceId = (deviceId: any): ErrorResponse | null => {
    if (!validate(deviceId, 'string')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'deviceId is required and must be a string')
    }
    return null
}

const isValidPayorDetails = (payorInfo: any, payorId: any): ErrorResponse | null => {
    let keys  = Object.keys(payorInfo)
    // Verify both id and info aren't passed in
    if (payorId && keys.length > 0) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'Unable to process when both payorId and payorInfo are provided')
    } else if(payorId && !validate(payorId, 'string')) { // Verify payorId is a string if present
        return handleTypedError(ErrorType.INVALID_PARAM, 'payorId must be a string')
    }
    return null
}

const isValidInvoiceAndRecurringId = (payTheoryInfo: any): ErrorResponse | null => {
    const { invoiceId, recurringId } = payTheoryInfo
    if (invoiceId && !validate(invoiceId, 'string')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'invoiceId must be a string')
    }
    if (recurringId && !validate(recurringId, 'string')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'recurringId must be a string')
    }
    if (invoiceId && recurringId) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'invoiceId and recurringId cannot both be present')
    }
    return null
}

const isValidFeeMode = (feeMode: any): ErrorResponse | null => {
    if (![common.MERCHANT_FEE, common.SERVICE_FEE].includes(feeMode)) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'feeMode must be either MERCHANT_FEE or SERVICE_FEE')
    }
    return null
}

const isValidFeeAmount = (fee: any): ErrorResponse | null => {
    if ((fee || typeof fee === 'number') && !validate(fee, 'number')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'fee must be a positive integer')
    }
    return null
}

const isValidBillingInfo = (billingInfo: any): ErrorResponse | null => {
    if (billingInfo && !validate(billingInfo, 'object')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'billingInfo must be an object')
    }
    if(billingInfo && billingInfo.address && !validate(billingInfo.address, 'object')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'billingInfo.address must be an object')
    }
    if(billingInfo && billingInfo.address && !validate(billingInfo.address.postal_code, 'string')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'billingInfo.address.postal_code is required when passing in billingInfo')
    }
    return null
}

const validateHostedCheckoutParams = (callToAction: any, acceptedPaymentMethods: any, paymentName: any): ErrorResponse | null => {
    if (callToAction && !common.CTA_TYPES.includes(callToAction)) {
        return handleTypedError(ErrorType.INVALID_PARAM, `callToAction must be one of ${common.CTA_TYPES.join(', ')}`)
    }
    if (acceptedPaymentMethods && !common.PAYMENT_METHOD_CONFIGS.includes(acceptedPaymentMethods)) {
        return handleTypedError(ErrorType.INVALID_PARAM, `acceptedPaymentMethods must be one of ${common.PAYMENT_METHOD_CONFIGS.join(', ')}`)
    }
    if (!validate(paymentName, 'string')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'paymentName must be a string')
    }
    return null
}

// Validate the details passed in for a transaction or redirect button
const validTransactionParams = (props: ModifiedTransactProps | ModifiedCheckoutDetails): ErrorResponse | null => {
    const { amount, payorInfo = {}, metadata, payTheoryData, feeMode } = props
    //validate the input param types
    let error = isvalidTransactParams(amount, payorInfo, metadata)
    if(error) return error
    //validate the amount
    error = isValidAmount(amount)
    if(error) return error
    //validate the payorInfo
    error = isValidPayorInfo(payorInfo)
    if(error) return error
    // validate the payorId
    error = isValidPayorDetails(payorInfo, payTheoryData?.payor_id)
    if(error) return error
    // validate the fee mode
    error = isValidFeeMode(feeMode)
    if(error) return error
    // validate the invoice and recurring id
    error = isValidInvoiceAndRecurringId(payTheoryData)
    if(error) return error
    // validate the billing info
    error = isValidBillingInfo(payTheoryData.billing_info)
    if(error) return error
    // validate the fee
    return isValidFeeAmount(payTheoryData?.fee);
}

const validQRSize = (size: any): ErrorResponse | null => {
    if (!validate(size, 'number')) {
        return handleTypedError(ErrorType.INVALID_PARAM, 'size must be a number')
    }
    return null
}



export {
    checkInitialParams,
    findCardNumberError,
    findCombinedCardError,
    findAchError,
    findCardError,
    findCashError,
    findCardPresentError,
    formatPayorObject,
    validate,
    isValidAmount,
    isValidDeviceId,
    isvalidTransactParams,
    isValidTokenizeParams,
    isValidPayorInfo,
    isValidPayorDetails,
    isValidFeeMode,
    isValidInvoiceAndRecurringId,
    isValidFeeAmount,
    isValidBillingInfo,
    validTransactionParams,
    validateHostedCheckoutParams,
    validQRSize
}
