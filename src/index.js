import './components/credit-card'
import './components/credit-card-account-name'
import './components/credit-card-cvv'
import './components/credit-card-expiration'
import './components/credit-card-number'
import './components/credit-card-zip'
import 'regenerator-runtime'
import './style.css'

const fields = {
    CREDIT_CARD_NAME: 'paytheory-credit-card-account-name',
    CREDIT_CARD_CVV: 'paytheory-credit-card-cvv',
    CREDIT_CARD_EXPIRATION: 'paytheory-credit-card-expiration',
    CREDIT_CARD_NUMBER: 'paytheory-credit-card-number',
    CREDIT_CARD_ZIP: 'paytheory-credit-card-zip'
}

async function postData(url = '', apiKey, data = {}) {
    const options = {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    }
    /* global fetch */
    const response = await fetch(url, options)
    return await response.json()
}


const transactionEndpoint = process.env.BUILD_ENV === 'stage' ?
    'https://demo.tags.api.paytheorystudy.com' :
    process.env.BUILD_ENV === 'prod' ?
    'https://tags.api.paytheory.com' :
    `https://${process.env.BUILD_ENV}.tags.api.paytheorystudy.com`

let identity = false

const addFrame = (container, element, styles, frameType = 'paytheory-credit-card-tag-frame') => {
    const tagFrame = document.createElement(frameType)
    tagFrame.setAttribute('ready', true)
    tagFrame.setAttribute('id', `${element}-tag-frame`)
    container.appendChild(tagFrame)
    window.postMessage({
            type: 'styles',
            styles
        },
        window.location.origin
    )
}

const createCreditCard = async(
    apiKey,
    clientKey,
    amount,
    styles = {
        default: {},
        success: {},
        error: {}
    },
    tags = {}
) => {


    return {
        mount: (element = 'paytheory-credit-card') => {
            if (typeof element !== 'string') throw new Error('invalid element')
            const container = document.getElementById(element)
            if (container) {
                if (!document.getElementById(`${element}-tag-frame`)) {
                    if (window.PaymentForm) {
                        addFrame(container, element, styles)
                    }
                    else {
                        const script = document.createElement('script')
                        // eslint-disable-next-line scanjs-rules/assign_to_src
                        script.src = 'https://forms.finixpymnts.com/finix.js'
                        script.addEventListener('load', function () {
                            addFrame(container, element, styles)
                        })
                        document.getElementsByTagName('head')[0].appendChild(script)
                    }
                }
                else {
                    throw new Error(`${element} is already mounted`)
                }
            }
            else {
                throw new Error(`${element} is not available in dom`)
            }
        },

        initTransaction: async(buyerOptions = {}) => {

            if (buyerOptions) {
                identity = await postData(
                    `${transactionEndpoint}/${clientKey}/identity`,
                    apiKey,
                    typeof buyerOptions === 'object' ? buyerOptions : {}
                )
            }


            window.postMessage({
                    type: `transact`,
                    transact: true
                },
                window.location.origin
            )
        },
        readyObserver: (readyCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message =
                    typeof event.data === 'string' ?
                    JSON.parse(event.data) :
                    event.data

                if (message.type === 'ready') {
                    readyCallback(message.ready)
                }
            })
        },
        transactedObserver: (transactedCallback) => {
            window.addEventListener('message', async(event) => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message =
                    typeof event.data === 'string' ?
                    JSON.parse(event.data) :
                    event.data
                if (message.type === 'tokenized') {
                    console.log('tokenized')
                    const instrument = await postData(
                        `${transactionEndpoint}/${clientKey}/instrument`,
                        apiKey, {
                            token: message.tokenized.data.id,
                            type: 'TOKEN',
                            identity: identity.id
                        }
                    )

                    const authorization = await postData(
                        `${transactionEndpoint}/${clientKey}/authorize`,
                        apiKey, {
                            source: instrument.id,
                            amount,
                            currency: 'USD',
                            tags: tags
                        }
                    )

                    transactedCallback({
                        last_four: instrument.last_four,
                        brand: instrument.brand,
                        ...authorization
                    })
                }
            })
        },
        errorObserver: (errorCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message =
                    typeof event.data === 'string' ?
                    JSON.parse(event.data) :
                    event.data
                if (message.type === 'error') {
                    errorCallback(message.error)
                }
            })
        },
        validObserver: (validCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message =
                    typeof event.data === 'string' ?
                    JSON.parse(event.data) :
                    event.data
                if (message.type === 'valid') {
                    validCallback(message.valid)
                }
            })
        }
    }
}

const createCreditCardFields = async(
    apiKey,
    clientKey,
    amount,
    styles = {
        default: {},
        success: {},
        error: {}
    },
    tags = {}
) => {

    let readyNumber = false,
        readyCVV = false,
        validNumber = false,
        validCVV = false

    return {
        mount: (elements = [
            fields.CREDIT_CARD_NUMBER,
            fields.CREDIT_CARD_CVV
        ]) => {
            elements.forEach(element => {
                if (typeof element !== 'string') throw new Error('invalid element')
                const container = document.getElementById(element)
                if (container) {
                    if (!document.getElementById(`${element}-tag-frame`)) {
                        if (window.PaymentForm) {
                            addFrame(container, element, styles, `${element}-tag-frame`)
                        }
                        else {
                            const script = document.createElement('script')
                            // eslint-disable-next-line scanjs-rules/assign_to_src
                            script.src = 'https://forms.finixpymnts.com/finix.js'
                            script.addEventListener('load', function () {
                                addFrame(container, element, styles, `${element}-tag-frame`)
                            })
                            document.getElementsByTagName('head')[0].appendChild(script)
                        }
                    }
                    else {
                        throw new Error(`${element} is already mounted`)
                    }
                }
                else {
                    throw new Error(`${element} is not available in dom`)
                }
            })

        },

        initTransaction: async(buyerOptions = {}) => {

            if (buyerOptions) {
                identity = await postData(
                    `${transactionEndpoint}/${clientKey}/identity`,
                    apiKey,
                    typeof buyerOptions === 'object' ? buyerOptions : {}
                )
            }


            window.postMessage({
                    type: `transact`,
                    transact: true
                },
                window.location.origin
            )
        },
        readyObserver: (readyCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message =
                    typeof event.data === 'string' ?
                    JSON.parse(event.data) :
                    event.data

                switch (message.type) {
                case 'cvv-ready':
                    {
                        readyCVV = message.ready
                        readyCallback(readyCVV && readyNumber)
                        break
                    }
                case 'number-ready':
                    {
                        readyNumber = message.ready
                        readyCallback(readyCVV && readyNumber)
                        break
                    }
                default:
                    {
                        break
                    }
                }
            })
        },
        transactedObserver: (transactedCallback) => {
            window.addEventListener('message', async(event) => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message =
                    typeof event.data === 'string' ?
                    JSON.parse(event.data) :
                    event.data
                if (message.type === 'tokenized') {
                    console.log('tokenized')
                    const instrument = await postData(
                        `${transactionEndpoint}/${clientKey}/instrument`,
                        apiKey, {
                            token: message.tokenized.data.id,
                            type: 'TOKEN',
                            identity: identity.id
                        }
                    )

                    const authorization = await postData(
                        `${transactionEndpoint}/${clientKey}/authorize`,
                        apiKey, {
                            source: instrument.id,
                            amount,
                            currency: 'USD',
                            tags: tags
                        }
                    )

                    transactedCallback({
                        last_four: instrument.last_four,
                        brand: instrument.brand,
                        ...authorization
                    })
                }
            })
        },
        errorObserver: (errorCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message =
                    typeof event.data === 'string' ?
                    JSON.parse(event.data) :
                    event.data
                if (message.type === 'error') {
                    errorCallback(message.error)
                }
            })
        },
        validObserver: (validCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) {
                    return
                }
                const message =
                    typeof event.data === 'string' ?
                    JSON.parse(event.data) :
                    event.data
                if (message.type === 'valid') {
                    validCallback(message.valid)
                }
                switch (message.type) {
                case 'cvv-valid':
                    {
                        validCVV = message.valid
                        validCallback(validCVV && validNumber)
                        break
                    }
                case 'number-valid':
                    {
                        validNumber = message.valid
                        validCallback(validCVV && validNumber)
                        break
                    }
                default:
                    {
                        break
                    }
                }
            })
        }
    }
}



window.paytheory = {
    createCreditCard,
    createCreditCardFields
}

export default window.paytheory
