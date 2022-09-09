/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import common from '../common'
import * as message from "../common/message";

// partner mode is used to indicate migration builds
const checkApiKey = (key,partnerMode) => {
    const stageIndex = partnerMode ? 2 : 1
    const keySplitLength = partnerMode ? 4 : 3
    if (typeof key !== 'string') {
        throw Error('Api key should be a string')
    }
    else if (key.split("-").length !== keySplitLength) {
        throw Error(`Api key should be a string formatted in ${keySplitLength} sections`)
    }
    else if (!key.split("-")[stageIndex].includes("paytheory")) {
        throw Error(`Api key has invalid stage ${key.split("-")[stageIndex]}`)
    }
}

const validate = (value, type) => {
    return typeof value === type && value
}

const checkFeeMode = mode => {
    if (!validate(mode, 'string') || ![common.INTERCHANGE, common.SERVICE_FEE].includes(mode)) {
        console.error(`Fee Mode should be either 'interchange' or 'service_fee' which are also available as constants at window.paytheory.INTERCHANGE and window.paytheory.SERVICE_FEE`)
    }
}

const checkMetadata = metadata => {
    if (!validate(metadata, 'object')) {
        throw Error(`Metadata should be a JSON Object`)
    }
}

const checkStyles = styles => {
    if (!validate(styles, 'object')) {
        throw Error(`Styles should be a JSON Object. An example of the object is at https://github.com/pay-theory/payment-components`)
    }
}

const checkEnv = env => {
    if (!validate(env, 'string')) {
        throw Error(`Environment not found in api key`)
    }
}
const VALID_STAGES = ['paytheory', 'paytheorylab', 'paytheorystudy']
const checkStage = stage => {
    if (!VALID_STAGES.includes(stage)) {
        throw Error(`Stage variable not found in api key`)
    }
}

const checkCreateParams = (key, mode, metadata, styles, env, stage, partnerMode) => {
    checkApiKey(key,partnerMode)
    checkFeeMode(mode)
    checkMetadata(metadata)
    checkStyles(styles)
    checkEnv(env)
    checkStage(stage)
}

//Lets the valid observer check that all fields are set to valid before sending a message
const hasValidCardNumber = types =>
    (types['card-number'] && types['card-cvv'] && types['card-exp'] && types['billing-zip'])

const hasValidCard = types => hasValidCardNumber(types)

const hasValidAccount = types =>
    (types['account-number'] && types['account-type'] && types['account-name'] && types['routing-number'])

const hasValidCash = types =>
    (types['cash-name'] && types['cash-contact'])


// Checks the dom for elements and returns errors if there are missing elements or conflicting elements
const findCardNumberError = processedElements => {
    let error = false
    if (processedElements.reduce(common.findExp, false) === false) {
        error = 'missing credit card expiration field required for payments'
    }

    if (processedElements.reduce(common.findCVV, false) === false) {
        error = 'missing credit card CVV field required for payments'
    }

    if(processedElements.reduce(common.findZip, false) === false) {
        error = 'missing billing zip field required for payments'
    }

    if (document.getElementById(`pay-theory-credit-card`)) {
        error = 'credit card element is not allowed when using credit card number'
    }
    return error
}

const findCombinedCardError = processedElements => {
    let error = false
    if (processedElements.reduce(common.findExp, false)) {
        error = 'expiration is not allowed when using combined credit card'
    }

    if (processedElements.reduce(common.findCVV, false)) {
        error = 'cvv is not allowed when using combined credit card'
    }

    if(processedElements.reduce(common.findZip, false) === false) {
        error = 'missing billing zip field required for payments'
    }

    if (document.getElementById(`pay-theory-credit-card-number`)) {
        error = 'credit card number is not allowed when using combined credit card'
    }
    return error
}

const achCheck = [{
    check: common.findAccountName,
    error: 'missing ACH account name field required for payments'
}, {
    check: common.findAccountNumber,
    error: 'missing ACH account number field required for payments'
}, {
    check: common.findAccountType,
    error: 'missing ACH account type field required for payments'
}, {
    check: common.findBankCode,
    error: 'missing ACH routing number field required for payments'
}, ]

const findAchError = (processedElements) => {
    let error = false
    if (processedElements.length === 0) {
        return error
    }

    achCheck.forEach(obj => {
        if (processedElements.reduce(obj.check, false) === false) {
            return obj.error
        }
    })

    return error
}

const findCardError = (processedElements, transacting) => {
    let error = false
    if (processedElements.length === 0) {
        return error
    }

    if (transacting === false) {
        error = 'missing credit card entry field required for payments'
    }
    else if (transacting.id === 'pay-theory-credit-card-number-tag-frame') {
        error = findCardNumberError(processedElements)
    }
    else {
        error = findCombinedCardError(processedElements)
    }
    return error
}

const findCashError = (processedElements) => {
    let error = false
    if (processedElements.length === 0) {
        return error
    }

    if (processedElements.reduce(common.findField('cash-name'), false) === false) {
        error = 'missing Cash name field required for payments'
    }

    if (processedElements.reduce(common.findField('cash-contact'), false) === false) {
        error = 'missing Cash Contact info field required for payments'
    }

    return error
}

const isValidPayorInfo = (payorInfo) => {
    if (!validate(payorInfo, 'object')) {
        message.handleError('INVALID_PARAM: payor_info is not an object')
        return false
    }
    if(payorInfo.same_as_billing === true) {
        const allowedKeys = ['same_as_billing', 'email', 'phone']
        const keys = Object.keys(payorInfo)
        for (let key of keys) {
            if (!allowedKeys.includes(key)) {
                message.handleError(`INVALID_PARAM: if payor_info is same_as_billing, only the following keys are allowed: ${allowedKeys.join(', ')}`)
                return false
            }
        }
    }
    return true
}

const validTypeMessage = elements => message => {
    if (typeof message.type === 'string') {
        const validType = message.type.split(':')[1]
        let types = []
        elements.card.forEach(element => {
            if (element.type === 'credit-card') {
                types = types.concat(common.combinedCardTypes)
            }
            else {
                types.push(element.type)
            }
        })
        types = types.concat(elements.ach.map(element => element.type))
        types = types.concat(elements.cash.map(element => element.type))
        return message.type.endsWith(':valid') && types.includes(`${validType}`)
    }
    return false
}

const isvalidTransactParams = (amount, payorInfo, metadata) => {
    //Make sure that we have the base required settings
    if (!validate(amount, 'number') || !validate(metadata, 'object') || !validate(payorInfo, 'object')) {
        const missing = `${!validate(amount, 'number') ? 'amount ' : ''}${!validate(metadata, 'object') ? 'metadata ' : ''}${!validate(payorInfo, 'object') ? 'payorInfo ' : ''}`
        message.handleError('INVALID_PARAM: Some required fields are missing or invalid: ' + missing)
        return false
    }
    return true
}

const isValidTokenizeParams = (payorInfo, metadata) => {
    //Make sure that we have the base required settings
    if (!validate(metadata, 'object') || !validate(payorInfo, 'object')) {
        const missing = `${!validate(metadata, 'object') ? 'metadata ' : ''}${!validate(payorInfo, 'object') ? 'payorInfo ' : ''}`
        message.handleError('INVALID_PARAM: Some required fields are missing or invalid: ' + missing)
        return false
    }
    return true
}

const isValidAmount = (amount) => {
    if (!validate(amount, 'number')) {
        message.handleError('INVALID_PARAM: amount must be a positive integer')
        return false
    }
    return true
}

const isValidPayorDetails = (payorInfo, payorId) => {
    let keys  = Object.keys(payorInfo)
    // Verify both id and info aren't passed in
    if (payorId && keys.length > 0) {
        message.handleError('INVALID_PARAM: Unable to process when both payorId and payorInfo are provided')
        return false
    } else if(payorId && !validate(payorId, 'string')) { // Verify payorId is a string if present
        message.handleError('INVALID_PARAM: payorId must be a string')
        return false
    }
    return true
}

const isValidInvoiceAndRecurringId = payTheoryInfo => {
    const { invoiceId, recurringId } = payTheoryInfo
    if (invoiceId && !validate(invoiceId, 'string')) {
        message.handleError('INVALID_PARAM: invoiceId must be a string')
        return false
    }
    if (recurringId && !validate(recurringId, 'string')) {
        message.handleError('INVALID_PARAM: recurringId must be a string')
        return false
    }
    if (invoiceId && recurringId) {
        message.handleError('INVALID_PARAM: invoiceId and recurringId cannot both be present')
        return false
    }
    return true
}

const isValidFeeMode = (feeMode) => {
    if (![common.INTERCHANGE, common.SERVICE_FEE].includes(feeMode)) {
        message.handleError('INVALID_PARAM: feeMode must be either INTERCHANGE or SERVICE_FEE')
        return false
    }
    return true
}

const isValidFeeAmount = (fee) => {
    if ((fee || typeof fee === 'number') && !validate(fee, 'number')) {
        message.handleError('INVALID_PARAM: fee must be a positive integer')
        return false
    }
    return true
}

export {
    checkCreateParams,
    hasValidCard,
    hasValidAccount,
    hasValidCash,
    findCardNumberError,
    findCombinedCardError,
    findAchError,
    findCardError,
    findCashError,
    validTypeMessage,
    validate,
    isValidAmount,
    isvalidTransactParams,
    isValidTokenizeParams,
    isValidPayorInfo,
    isValidPayorDetails,
    isValidFeeMode,
    isValidInvoiceAndRecurringId,
    isValidFeeAmount
}
