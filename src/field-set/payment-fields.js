import common from '../common'

export default async(
    apiKey,
    clientKey,
    styles = common.defaultStyles,
    tags = common.defaultTags,
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

    const hasValidCard = types => {
        (types['credit-card'] || (types.number && types.cvv && types.exp))
    }

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

    let isReady = false

    window.addEventListener("beforeunload", () => { common.removeReady() })

    const establishElements = (elements) => {
        return common.processElements(elements, styles)
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
            'credit-card': common.fields.CREDIT_CARD,
            'number': common.fields.CREDIT_CARD_NUMBER,
            'exp': common.fields.CREDIT_CARD_EXP,
            'cvv': common.fields.CREDIT_CARD_CVV,
            'account-name': common.fields.CREDIT_CARD_NAME,
            'address-1': common.fields.CREDIT_CARD_ADDRESS1,
            'address-2': common.fields.CREDIT_CARD_ADDRESS2,
            city: common.fields.CREDIT_CARD_CITY,
            state: common.fields.CREDIT_CARD_STATE,
            zip: common.fields.CREDIT_CARD_ZIP,
        },
    ) => {
        processedElements = establishElements(elements)
        const handleState = stateHandler(processedElements)
        const handleFormed = finalForm => {
            const transacting = processedElements.reduce(common.findTransactingElement, false)
            let error = findCardError(transacting, processedElements)
            if (error) {
                return common.handleError(error)
            }

            processedElements.forEach(processed => {
                processed.frame.form = finalForm
            })

            window.postMessage({
                    type: `pay-theory:ready`,
                    ready: true,
                },
                window.location.origin,
            )
        }

        if (!formed) {
            common.appendFinix(formed, handleState, handleFormed)
        }
    }

    const handleInitialized = (amount, buyerOptions, confirmation) => {
        const transacting = processedElements.reduce(common.findTransactingElement, false)

        const action = confirmation ? 'tokenize' : 'transact'
        common.setBuyer(buyerOptions)

        if (transacting.frame) {
            transacting.frame[action] = amount
        }
        else {
            transacting[action] = amount
        }

    }

    const initTransaction = common.generateInitialization(handleInitialized)

    const confirm = () => {
        const transacting = processedElements.reduce(common.findTransactingElement, false)

        if (transacting.frame) {
            transacting.frame.capture = true
        }
        else {
            transacting.capture = true
        }
    }

    const cancel = () => {
        const transacting = processedElements.reduce(common.findTransactingElement, false)
        transacting['tokenize'] = false
        common.removeIdentity()
        common.removeToken()
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
            const validType = message.type.split(':')[1]
            return message.type.endsWith(':valid') && processedElements.map(element => element.type).includes(`${validType}`)
        },
        message => {
            const type = message.type.split(':')[1]

            let validating = false



            if (validTypes[type]) {

                validTypes[type] = message.valid

                const validatingCard = hasValidCard(validTypes)

                const validatingDetails = hasValidDetails(validTypes)

                validating = (validatingCard && validatingDetails)

                if (isCallingType(type)) {
                    isValid = validating
                    cb(isValid)
                }
            }
        })

    return common.generateReturn(mount, initTransaction, confirm, cancel, readyObserver, validObserver, { host, clientKey, apiKey }, tags)
}
