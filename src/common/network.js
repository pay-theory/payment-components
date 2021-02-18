/* global navigator */
import * as data from './data'
import * as message from './message'
export const postData = async(url, apiKey, data = {}) => {
    const options = {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data),
    }
    /* global fetch */
    const response = await fetch(url, options)
    return await response.json()
}

export const getData = async(url, apiKey) => {
    const options = {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json',
        }
    }
    /* global fetch */
    const response = await fetch(url, options)
    return await response.json()
}

const isValidTransaction = (tokenized) => {

    if (tokenized) {
        window.postMessage({
                type: 'pt:error',
                error: 'transaction already initiated',
                throws: true
            },
            window.location.origin,
        );
        return false
    }
    return true
}

export const invalidate = _t => (_t.isDirty ? _t.errorMessages.length > 0 : null)

const CARD = "PAYMENT_CARD"
const ACH = "BANK_ACCOUNT"

export const defaultEnvironment = (() => {

    switch (process.env.BUILD_ENV) {
    case 'prod':
        {
            return 'prod'
        }
    case 'stage':
        {
            return 'demo'
        }
    default:
        {
            return 'dev'
        }
    }
})()

export const transactionEndpoint = (env) => {

    switch (env) {
    case 'prod':
        {
            return `https://tags.api.paytheory.com`
        }
    default:
        {
            return `https://${env}.tags.api.paytheorystudy.com`
        }
    }
}

export const hostedFieldsEndpoint = (env) => {

    switch (env) {
    case 'prod':
        {
            return `https://tags.static.paytheory.com`
        }
    default:
        {
            return `https://${env}.tags.static.paytheorystudy.com`
        }
    }
}

export const generateTokenize = (cb, apiKey, fee_mode) => {
    return async message => {
        let transacting = data.getTransactingElement()
        document.getElementById(transacting).idempotencyCallback = cb
        idempotency(apiKey, fee_mode, message)
    }
}

const requestIdempotency = async(apiKey, fee_mode, message) => {
    const payment = message.tokenize ? message.tokenize : message.transact
    payment.fee_mode = fee_mode
    let transacting = data.getTransactingElement()
    let action = document.getElementById(transacting).action
    const frameName = transacting.includes('credit-card') ?
        'card-number' :
        'account-number'

    document.getElementsByName(`${frameName}-iframe`)[0].contentWindow.postMessage({
            type: "pt-static:idempotency",
            element: frameName,
            apiKey,
            payment,
            action
        },
        hostedFieldsEndpoint(data.getEnvironment()),
    )
}

const idempotency = async(apiKey, fee_mode, message) => {
    if (isValidTransaction(data.getToken())) {

        requestIdempotency(apiKey, fee_mode, message)
    }
}




const transfer = (tags, transfer) => {
    const frameName = data.getTransactingElement().includes('credit-card') ?
        'card-number' :
        'account-number'

    document.getElementsByName(`${frameName}-iframe`)[0].contentWindow.postMessage({
            type: "pt-static:transfer",
            element: frameName,
            transfer,
            tags
        },
        hostedFieldsEndpoint(data.getEnvironment()),
    )
}

export const generateCapture = (cb, tags = {}) => {
    return async() => {
        isValidTransaction(data.getIdentity())
        let transacting = document.getElementById(data.getTransactingElement())
        transacting.captureCallback = cb
        setTimeout(() => transfer(tags, transacting.idempotent), 100)
    }
}

export const generateTransacted = (cb, apiKey, fee_mode, tags = {}) => {
    return async message => {
        isValidTransaction(data.getToken())

        let transacting = data.getTransactingElement()
        const transactingElement = document.getElementById(transacting)
        transactingElement.idempotencyCallback = (token) => {
            transactingElement.captureCallback = cb
            setTimeout(() => transfer(tags, transactingElement.idempotent), 100)
        }

        idempotency(apiKey, fee_mode, message)
    }
}

export const generateInitialization = (handleInitialized, challengeOptions, env) => {
    return async(amount, buyerOptions = {}, confirmation = false) => {
        if (typeof amount === 'number' && Number.isInteger(amount) && amount > 0) {

            // if (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {

            //     challengeOptions.challenge = Uint8Array.from(
            //         challengeOptions.challenge,
            //         c => c.charCodeAt(0))

            //     challengeOptions.user.id = Uint8Array.from(
            //         challengeOptions.user.id,
            //         c => c.charCodeAt(0))

            //     await navigator.credentials.create({
            //         publicKey: challengeOptions
            //     })
            // }
            await handleInitialized(amount, buyerOptions, confirmation)
            const transacting = data.getTransactingElement()
            if (transacting === 'pay-theory-ach-account-number-tag-frame') {
                data.achFieldTypes.forEach(field => {
                    document.getElementsByName(`${field}-iframe`)[0].contentWindow.postMessage({
                            type: "pt-static:transact",
                            element: field,
                            buyerOptions
                        },
                        hostedFieldsEndpoint(env),
                    );
                })
            }
            else {
                data.fieldTypes.forEach(field => {
                    let iframe = document.getElementsByName(`${data.stateMap[field]}-iframe`)[0]
                    if (iframe) {
                        iframe.contentWindow.postMessage({
                                type: "pt-static:transact",
                                element: data.stateMap[field],
                                buyerOptions
                            },
                            hostedFieldsEndpoint(env),
                        );
                    }
                })
            }
        }
        else {
            return message.handleError('amount must be a positive integer')
        }
    }
}
