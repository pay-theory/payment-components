import common from '../common'

export default async(
    apiKey,
    legacy, // this used to be client id, left in place to preserve backwards compatibility
    styles = common.defaultStyles,
    tags = common.defaultTags,
    fee_mode = common.defaultFeeMode,
    host = common.transactionEndpoint
) => {
    const validTypes = {
        'credit-card': false,
        'number': false,
        'exp': false,
        'cvv': false,
        'account-name': true,
        'address-1': true,
        'address-2': true,
        'city': true,
        'state': true,
        'zip': true
    }

    const isCallingType = type => Object.keys(validTypes).includes(type)

    const hasValidCard = types =>
        (types['credit-card'] || (types.number && types.cvv && types.exp))


    const hasValidStreetAddress = types =>
        (types['address-1'] && types['address-2'])

    const hasValidAddress = types =>
        (hasValidStreetAddress(types) && types.city && types.state && types.zip)

    const hasValidDetails = types =>
        (types['account-name'] && hasValidAddress(types))

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

    const findCardError = (transacting, processedElements) => {
        let error = false
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



    let formed = false

    let isValid = false

    let processedElements = []

    let transacting = {}

    let isReady = false

    window.addEventListener("beforeunload", () => { common.removeReady() })

    const establishElements = (elements) => {
        return common.processAchElements(elements, styles)
    }

    const isValidFrame = invalidElement => typeof invalidElement === 'undefined' ?
        invalidElement :
        !invalidElement

    const handleElement = (element, errors, invalidElement, stated) => {
        if (invalidElement) {
            errors.push(stated.errorMessages[0])
            element.frame.error = stated.errorMessages[0]
        }
        else {
            element.frame.error = false
        }
    }

    const stateHandler = elements => state => {
        let errors = []
        elements.forEach(element => {
            const [, stated, invalidElement] = common.stateMapping(element.type, state)

            if (stated.isDirty) {
                element.frame.valid = isValidFrame(invalidElement)

                handleElement(element, errors, invalidElement, stated)
            }

        })
    }

    const mount = async(
        elements = {
            'account-number': common.achFields.ACCOUNT_NUMBER,
            'account-name': common.achFields.ACCOUNT_NAME,
            'bank-code': common.achFields.BANK_CODE,
            'account-type': common.achFields.ACCOUNT_TYPE,
        },
    ) => {
        processedElements = establishElements(elements)
        processedElements.forEach(processed => {
            processed.frame.form = true
        })
    }

    const handleInitialized = (amount, buyerOptions, confirmation) => {

        const action = confirmation ? 'tokenize' : 'transact'
        common.setBuyer(buyerOptions)

        const framed = transacting.frame ? transacting.frame : transacting

        framed[action] = amount
    }

    const initTransaction = common.generateInitialization(handleInitialized)

    const confirm = () => {

        if (transacting.frame) {
            transacting.frame.capture = true
        }
        else {
            transacting.capture = true
        }
    }

    const cancel = () => {

        transacting['tokenize'] = false
        common.removeIdentity()
        common.removeToken()
    }

    const testApi = async(url, apiKey) => {
        const result = await common.getData(url, apiKey)
        return result
    }

    const readyObserver = cb => common.handleMessage(
        common.readyTypeMessage,
        message => {
            if (message.type === 'pay-theory:ready' & !isReady && common.getReady() === null) {
                common.setReady(true)
                isReady = message.ready
                cb(message.ready)
            }
        })

    const validObserver = cb => common.handleMessage(
        message => {
            if (typeof message.type === 'string') {
                const validType = message.type.split(':')[1]
                return message.type.endsWith(':valid') && processedElements.map(element => element.type).includes(`${validType}`)
            }
            return false
        },
        message => {
            const type = message.type.split(':')[1]

            let validating = false



            if (typeof validTypes[type] !== 'undefined') {

                validTypes[type] = message.valid

                const validatingCard = hasValidCard(validTypes)

                const validatingDetails = hasValidDetails(validTypes)

                validating = (validatingCard && validatingDetails)

                if (isCallingType(type) && isValid !== validating) {
                    isValid = validating
                    cb(isValid)
                }
            }
        })
    return { mount, testApi }
}
