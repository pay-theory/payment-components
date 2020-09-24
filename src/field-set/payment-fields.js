import common from './common'

export default async(
    apiKey,
    clientKey,
    styles = common.defaultStyles,
    tags = common.defaultTags,
    host = common.transactionEndpoint
) => {
    let validCard = false
    let validCardNumber = false
    let validCardCVV = false
    let validCardExp = false
    let validName = true
    let validAddress1 = true
    let validAddress2 = true
    let validCity = true
    let validState = true
    let validZip = true

    let formed = false

    let isValid = false

    let processedElements = []

    let isReady = false

    const establishElements = (elements) => {
        return common.processElements(elements, styles)
    }

    const stateHandler = elements => state => {
        let errors = []
        elements.forEach(element => {

            const [, stated, invalidElement] = common.stateMapping(element.type, state)


            element.frame.valid = typeof invalidElement === 'undefined' ? invalidElement : !invalidElement

            if (invalidElement) {
                errors.push(stated.errorMessages[0])
                element.frame.error = stated.errorMessages[0]
            }
            else {
                element.frame.error = false
            }

        })
    }

    const mount = async(
        elements = {
            'credit-card': common.fields.CREDIT_CARD,
            'credit-card-number': common.fields.CREDIT_CARD_NUMBER,
            'credit-card-exp': common.fields.CREDIT_CARD_EXP,
            'credit-card-cvv': common.fields.CREDIT_CARD_CVV,
            'account-name': common.fields.CREDIT_CARD_NAME,
            'account-address-1': common.fields.CREDIT_CARD_ADDRESS1,
            'account-address-2': common.fields.CREDIT_CARD_ADDRESS2,
            'account-city': common.fields.CREDIT_CARD_CITY,
            'account-state': common.fields.CREDIT_CARD_STATE,
            zip: common.fields.CREDIT_CARD_ZIP,
        },
    ) => {

        processedElements = establishElements(elements)

        const handleState = stateHandler(processedElements)

        const handleFormed = finalForm => {
            const transacting = processedElements.reduce(common.findTransactingElement, false)

            if (transacting === false) {
                throw new Error('missing credit card entry field required for payments')
            }

            if (transacting.type === 'credit-card-number') {
                if (processedElements.reduce(common.findExp, false) === false) {
                    throw new Error('missing credit card expiration field required for payments')
                }

                if (processedElements.reduce(common.findCVV, false) === false) {
                    throw new Error('missing credit card CVV field required for payments')
                }
            }

            processedElements.forEach(processed => { processed.frame.form = finalForm })

            window.postMessage({
                    type: `pay-theory-ready`,
                    ready: true,
                },
                window.location.origin,
            )
        }

        if (!formed) {
            common.appendFinix(formed, handleState, handleFormed)
        }
    }

    const handleInitialized = (amount, confirmation) => {
        const transacting = processedElements.reduce(common.findTransactingElement, false)

        const action = confirmation ? 'tokenize' : 'transact'

        if (transacting.frame) {
            transacting.frame[action] = amount
        }
        else {
            transacting[action] = amount
        }

    }

    const initTransaction = common.generateInitialization(handleInitialized, host, clientKey, apiKey)

    const confirm = () => {
        const transacting = processedElements.reduce(common.findTransactingElement, false)

        if (transacting.frame) {
            transacting.frame.capture = true
        }
        else {
            transacting.capture = true
        }

    }

    const readyObserver = cb => common.handleMessage(
        common.readyTypeMessage,
        message => {
            if (!message.type === 'pay-theory-ready' || isReady) { return }
            isReady = message.ready
            cb(message.ready)
        })

    const validObserver = cb => common.handleMessage(
        message => {
            const validType = message.type.split(':')[0]
            return message.type.endsWith(':valid') && processedElements.map(element => element.type).includes(`${validType}`)
        },
        message => {
            const validType = message.type.split(':')[0]
            let calling = false
            switch (validType) {
            case 'credit-card':
                {
                    validCard = message.valid
                    calling = true
                    break
                }
            case 'credit-card-number':
                {
                    validCardNumber = message.valid
                    calling = true
                    break
                }
            case 'credit-card-exp':
                {
                    validCardExp = message.valid
                    calling = true
                    break
                }
            case 'credit-card-cvv':
                {
                    validCardCVV = message.valid
                    calling = true
                    break
                }
            case 'account-name':
                {
                    validName = message.valid
                    calling = true
                    break
                }
            case 'account-address-1':
                {
                    validAddress1 = message.valid
                    calling = true
                    break
                }
            case 'account-address-2':
                {
                    validAddress2 = message.valid
                    calling = true
                    break
                }
            case 'account-city':
                {
                    validCity = message.valid
                    calling = true
                    break
                }
            case 'account-state':
                {
                    validState = message.valid
                    calling = true
                    break
                }
            case 'zip':
                {
                    validZip = message.valid
                    calling = true
                    break
                }
            default:
                {
                    break
                }
            }

            const validatingCard = (validCard || (validCardNumber && validCardCVV && validCardExp))

            const validating = (validatingCard &&
                validName &&
                validAddress1 &&
                validAddress2 &&
                validCity &&
                validState &&
                validZip)

            if (isValid !== validating) {
                isValid = validating
                if (calling) {
                    cb(isValid)
                }
            }
        })

    return common.generateReturn(mount, initTransaction, confirm, readyObserver, validObserver, { host, clientKey, apiKey }, tags)
}
