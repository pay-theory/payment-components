import { processElement, invalidate, postData, transactionEndpoint, stateMap } from './util'

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
    let formed = false
    let identity = false
    let framed
    return {
        mount: (element = 'pay-theory-credit-card') => {
            if (formed) {
                framed = processElement(formed, element, styles)
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
                            badger.setAttribute('class', `paytheory-card-badge paytheory-card-${badge}`)
                            const badged = document.getElementById('badge-wrapper')
                            if (badged !== null) {
                                badged.innerHTML = ''
                                badged.appendChild(badger)
                            }
                        }

                        if (state) {
                            const processedElements = [
                                { type: 'zip', frame: framed },
                                { type: 'expiration', frame: framed },
                                { type: 'cvv', frame: framed },
                                { type: 'number', frame: framed }
                            ]

                            let errors = []

                            const validElements = []
                            const undefinedElements = []
                            const errorElements = []
                            let error = false

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



                                const frameValidationStep = typeof invalidElement === 'undefined' ? invalidElement : !invalidElement

                                switch (frameValidationStep) {
                                case true:
                                    {
                                        validElements.push(stateType)
                                        break
                                    }
                                case undefined:
                                    {
                                        undefinedElements.push(stateType)
                                        break
                                    }
                                default:
                                    {
                                        errorElements.push(stateType)
                                        error = stated.errorMessages[0]
                                        break
                                    }
                                }
                            })


                            if (validElements.length === processedElements.length) {
                                framed.valid = true
                                framed.error = false
                            }
                            else if (error) {
                                framed.valid = false
                                framed.error = error
                            }
                            else {
                                framed.valid = undefined
                                framed.error = false
                            }
                        }
                    })
                    framed = processElement(formed, element, styles)
                })
                document.getElementsByTagName('head')[0].appendChild(script)
            }
        },

        initTransaction: async(buyerOptions = {}) => {
            if (buyerOptions) {
                identity = await postData(
                    `${host}/${clientKey}/identity`,
                    apiKey,
                    typeof buyerOptions === 'object' ? buyerOptions : {},
                )
            }

            framed.transact = true
        },

        readyObserver: readyCallback => {
            window.addEventListener('message', event => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

                if (message.type === 'credit-card-ready') {
                    readyCallback(message.ready)
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
                            tags: tags,
                        },
                    )

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
                if (message.type === 'credit-card-valid') {
                    validCallback(message.valid)
                }
            })
        },
    }
}
