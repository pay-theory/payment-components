/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import common from '../common'

const checkApiKey = key => {
    if (typeof key !== 'string') {
        throw Error('Api key should be a string beginning with pt-')
    }
    else if (!key.startsWith('pt-')) {
        throw Error('Api key should be a string beginning with pt-')
    }
}

const checkFeeMode = mode => {
    if (typeof mode !== 'string') {
        throw Error(`Fee Mode should be either 'surcharge' or 'service_fee' which are also available as constants at window.paytheory.SURCHARGE and window.paytheory.SERVICE_FEE`)
    }
}

const checkTags = tags => {
    if (typeof tags !== 'object') {
        throw Error(`Tags should be a JSON Object`)
    }
}

const checkStyles = styles => {
    if (typeof styles !== 'object') {
        throw Error(`Styles should be a JSON Object. An example of the object is at https://github.com/pay-theory/payment-components`)
    }
}

const checkEnv = env => {
    if (typeof env !== 'string') {
        throw Error(`Environment variable should be a string`)
    }
}

const checkCreateParams = (key, mode, tags, styles, env) => {
    checkApiKey(key)
    checkFeeMode(mode)
    checkTags(tags)
    checkStyles(styles)
    checkEnv(env)
}

//Lets the alid observer check that all fields are set to valid before sending a message
const hasValidStreetAddress = types =>
    (types['billing-line1'] && types['billing-line2'])

const hasValidAddress = types =>
    (hasValidStreetAddress(types) && types['billing-city'] && types['billing-state'] && types['billing-zip'])

const hasValidCardNumber = types =>
    (types['card-number'] && types['card-cvv'] && types['card-exp'])

const hasValidCard = types => hasValidCardNumber(types)

const hasValidAccount = types =>
    (types['account-number'] && types['account-type'] && types['account-name'] && types['routing-number'])

const hasValidCash = types =>
    (types['cash-name'] && types['cash-contact'])


//Checkes the dom for elements and returns errors if there are missing elements or conflicting elements
const findCardNumberError = processedElements => {
    let error = false
    if (processedElements.reduce(common.findExp, false) === false) {
        error = 'missing credit card expiration field required for payments'
    }

    if (processedElements.reduce(common.findCVV, false) === false) {
        error = 'missing credit card CVV field required for payments'
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
    validTypeMessage
}
