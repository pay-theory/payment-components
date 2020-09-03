import common from './common'

const ELEMENTS = [{ type: 'security_code|expiration_date|number', type: 'name', type: 'address.postal_code' }]

export default async(
    apiKey,
    clientKey,
    styles = common.defaultStyles,
    tags = common.defaultTags,
    host = common.transactionEndpoint
) => {
    let validName = true
    let validCard = false
    let validZip = true

    let formed = false

    let isValid = false

    let processedElements = []



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
            'account-name': common.fields.CREDIT_CARD_NAME,
            'credit-card': common.fields.CREDIT_CARD,
            zip: common.fields.CREDIT_CARD_ZIP,
        },
    ) => {

        processedElements = establishElements(elements)

        const handleState = stateHandler(processedElements)

        const handleFormed = finalForm => {
            processedElements.forEach(processed => { processed.frame.form = finalForm })
            window.postMessage({
                    type: `pay-theory-ready`,
                    ready: isValid,
                },
                window.location.origin,
            )
        }

        if (!formed) {
            common.appendFinix(formed, handleState, handleFormed)
        }
    }

    const handleInitialized = (amount) => {
        const transacting = processedElements.reduce(common.findTransactingElement)
        if (transacting.frame) {
            transacting.frame.transact = amount
        }
        else {
            transacting.transact = amount
        }
    }

    const initTransaction = common.generateInitialization(handleInitialized, host, clientKey, apiKey)

    const readyObserver = cb => common.handleMessage(
        common.readyTypeMessage,
        message => {
            if (!message.type === 'pay-theory-ready') { return }

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
            case 'name':
                {
                    validName = message.valid
                    calling = true
                    break
                }
            case 'credit-card':
                {
                    validCard = message.valid
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

            const validating = (validCard && validZip && validName)

            if (isValid !== validating) {
                isValid = validating
                if (calling) {
                    cb(isValid)
                }
            }
        })

    return common.generateReturn(mount, initTransaction, readyObserver, validObserver, { host, clientKey, apiKey }, tags)
}
