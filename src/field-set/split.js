/* global localStorage */
import common from './common'

export default async(
    apiKey,
    clientKey,
    amount,
    styles = {
        default: {},
        success: {},
        error: {},
    },
    tags = {},
    host = common.transactionEndpoint
) => {
    let identity = false

    let setReady = false

    let readyNumber = false
    let readyName = true
    let readyCVV = true
    let readyExpiration = true
    let readyZip = true

    let validName = true
    let validNumber = false
    let validCVV = false
    let validExpiration = false
    let validZip = true

    let formed = false

    let isValid = false
    let isReady = false

    let processedElements = []
    let transactingElement

    const handleInialized = () => {
        if (transactingElement.frame) {
            transactingElement.frame.transact = true
        }
        else {
            transactingElement.transact = true
        }
    }

    return {
        mount: async(
            elements = {
                'account-name': fields.CREDIT_CARD_NAME,
                number: fields.CREDIT_CARD_NUMBER,
                cvv: fields.CREDIT_CARD_CVV,
                expiration: fields.CREDIT_CARD_EXPIRATION,
                zip: fields.CREDIT_CARD_ZIP,
            },
        ) => {
            if (formed) {
                processedElements = common.processElements(formed, elements, styles)
                transactingElement = common.processedElements.reduce(common.findTransactingElement)
                return
            }
            else {
                const handleState = state => {
                    let errors = []

                    processedElements.forEach(element => {

                        const stateType = common.stateMap[element.type] ?
                            common.stateMap[element.type] :
                            element.type

                        const stated = state[stateType]

                        const invalidElement = common.invalidate(stated)

                        if (element.frame.field === element.type) {
                            element.frame.valid = typeof invalidElement === 'undefined' ? invalidElement : !invalidElement

                            if (invalidElement) {
                                errors.push(stated.errorMessages[0])
                                element.frame.error = stated.errorMessages[0]
                            }
                            else {
                                element.frame.error = false
                            }
                        }
                    })
                }

                const handleFormed = finalForm => {
                    processedElements = common.processElements(finalForm, elements, styles);
                    transactingElement = processedElements.reduce(common.findTransactingElement);
                }

                common.appendFinix(formed, handleState, handleFormed)
            }
        },

        initTransaction: common.generateInitialization(handleInialized, host, clientKey, apiKey),

        readyObserver: cb => common.handleMessage(
            message => message.type.endsWith('-ready'),
            message => {
                let calling = false

                let processed = false

                if (!message.type.endsWith('-ready')) { return }

                if (!setReady) {
                    processedElements.forEach(element => {
                        switch (element.type) {
                        case 'name':
                            {
                                readyName = false
                                setReady = true
                                break
                            }
                        case 'cvv':
                            {
                                readyCVV = false
                                setReady = true
                                break
                            }
                        case 'number':
                            {
                                readyNumber = false
                                setReady = true
                                break
                            }
                        case 'expiration':
                            {
                                readyExpiration = false
                                setReady = true
                                break
                            }
                        case 'zip':
                            {
                                readyZip = false
                                setReady = true
                                break
                            }
                        default:
                            {
                                break
                            }
                        }
                    })
                }

                const readyType = message.type.split('-')[0]

                if (!processedElements.map(element => element.type).includes(`${readyType}`)) { return }

                switch (readyType) {
                case 'name':
                    {
                        readyName = message.ready
                        calling = true
                        break
                    }
                case 'cvv':
                    {
                        readyCVV = message.ready
                        calling = true
                        break
                    }
                case 'number':
                    {
                        readyNumber = message.ready
                        calling = true
                        break
                    }
                case 'expiration':
                    {
                        readyExpiration = message.ready
                        calling = true
                        break
                    }
                case 'zip':
                    {
                        readyZip = message.ready
                        calling = true
                        break
                    }
                default:
                    {
                        break
                    }
                }
                const readying = (readyCVV && readyNumber && readyExpiration && readyName && readyZip)
                if (isReady !== readying) {
                    isReady = readying
                    if (calling) {
                        cb(isReady)
                    }
                }
            }),

        transactedObserver: cb => common.handleMessage(
            message => message.type === 'tokenized',
            common.generateTransacted(cb, host, clientKey, apiKey, amount)),

        errorObserver: cb => common.handleMessage(message => message.type === 'error', message => cb(message.error)),

        validObserver: cb => common.handleMessage(
            message => {
                const validType = message.type.split('-')[0]
                return message.type.endsWith('-valid') && processedElements.map(element => element.type).includes(`${validType}`)
            },
            message => {
                const validType = message.type.split('-')[0]
                let calling = false

                switch (validType) {
                case 'name':
                    {
                        validName = message.valid
                        calling = true
                        break
                    }
                case 'cvv':
                    {
                        validCVV = message.valid
                        calling = true
                        break
                    }
                case 'number':
                    {
                        validNumber = message.valid
                        calling = true
                        break
                    }
                case 'expiration':
                    {
                        validExpiration = message.valid
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

                const validating = (validCVV && validNumber && validExpiration && validZip && validName)

                if (isValid !== validating) {
                    isValid = validating
                    if (calling) {
                        cb(isValid)
                    }
                }
            }),
    }
}
