import {
    processElements,
    invalidate,
    postData,
    fields,
    stateMap,
    transactionEndpoint
}
from './util'
const IDENTITY = 'pt-identity'
const findTransactingElement = (element, cv) => element.type === 'number' ? element.frame : cv

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
    host = transactionEndpoint
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
                processedElements = processElements(formed, elements, styles)
                transactingElement = processedElements.reduce(findTransactingElement)
                return
            }
            else {
                const script = document.createElement('script')
                // eslint-disable-next-line scanjs-rules/assign_to_src
                script.src = 'https://forms.finixpymnts.com/finix.js'
                script.addEventListener('load', function () {
                    formed = window.PaymentForm.card((state, binInformation) => {
                        if (binInformation) {
                            const badge = binInformation.cardBrand
                            const badger = document.createElement('div')
                            badger.setAttribute('class', `pay-theory-card-badge pay-theory-card-${badge}`)
                            const badged = document.getElementById('pay-theory-badge-wrapper')
                            if (badged !== null) {
                                badged.innerHTML = ''
                                badged.appendChild(badger)
                            }
                        }

                        if (state) {
                            let errors = []

                            processedElements.forEach(element => {
                                let stateType = ''

                                if (stateMap[element.type]) {
                                    stateType = stateMap[element.type]
                                }
                                else {
                                    stateType = element.type
                                }

                                const stated = state[stateType]
                                const invalidElement = invalidate(stated)
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
                    })
                    processedElements = processElements(formed, elements, styles);
                    transactingElement = processedElements.reduce(findTransactingElement);
                    return
                })
                document.getElementsByTagName('head')[0].appendChild(script)
            }
        },

        initTransaction: async(buyerOptions = {}) => {
            const stored = localStorage.getItem(IDENTITY)

            const restore = stored ?
                JSON.parse(stored)
            false

            identity = restore ?
                restore :
                await postData(
                    `${host}/${clientKey}/identity`,
                    apiKey,
                    typeof buyerOptions === 'object' ? buyerOptions : {},
                )

            localStorage.setItem(IDENTITY, JSON.stringify(identity))


            if (transactingElement.frame) {
                transactingElement.frame.transact = true
            }
            else {
                transactingElement.transact = true
            }
        },

        readyObserver: readyCallback => {
            window.addEventListener('message', event => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

                let calling = false

                let processed = false

                if (!message.type.endsWith('-ready')) return

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

                if (!processedElements.map(element => element.type).includes(`${readyType}`)) return

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
                if (isReady != readying) {
                    isReady = readying
                    if (calling) {
                        readyCallback(isReady)
                    }
                }
            })
        },

        transactedObserver: transactedCallback => {
            window.addEventListener('message', async event => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
                if (message.type === 'tokenized') {
                    const instrument = await postData(
                        `${host}/${clientKey}/instrument`,
                        apiKey, {
                            token: message.tokenized.data.id,
                            type: 'TOKEN',
                            identity: identity.id,
                        },
                    )

                    const authorization = await postData(
                        `${host}/${clientKey}/authorize`,
                        apiKey, {
                            source: instrument.id,
                            amount,
                            currency: 'USD',
                            idempotency_id: identity.idempotencyId,
                            tags: { 'pt-number': identity.idempotencyId, ...tags },
                        },
                    )

                    localStorage.removeItem(IDENTITY)

                    transactedCallback({
                        last_four: instrument.last_four,
                        brand: instrument.brand,
                        ...authorization,
                    })
                }
            })
        },

        errorObserver: errorCallback => {
            window.addEventListener('message', event => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
                if (message.type === 'error') {
                    errorCallback(message.error)
                }
            })
        },

        validObserver: validCallback => {
            window.addEventListener('message', event => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

                if (!message.type.endsWith('-valid')) return

                const validType = message.type.split('-')[0]

                if (!processedElements.map(element => element.type).includes(`${validType}`)) return

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

                if (isValid != validating) {
                    isValid = validating
                    if (calling) {
                        validCallback(isValid)
                    }
                }

            })
        },
    }
}
