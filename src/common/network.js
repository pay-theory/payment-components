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

const requestIdempotency = async(apiKey, fee_mode, message) => {
    console.log('requesting idempotency')
    const payment = message.tokenize ? message.tokenize : message.transact
    payment.fee_mode = fee_mode
    let transacting = data.getTransactingElement()
    console.log('requesting idempotency', 'transacting', transacting)
    let action = document.getElementById(transacting).action
    console.log('requesting idempotency', 'action', action)
    const frameName = transacting.includes('credit-card') ?
        'card-number' :
        'account-number'
    console.log('requesting idempotency', 'frameName', frameName)
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

export const generateTokenize = (cb, apiKey, fee_mode) => {
    return async message => {
        let transacting = data.getTransactingElement()
        document.getElementById(transacting).idempotencyCallback = cb
        idempotency(apiKey, fee_mode, message)
    }
}


const transfer = (tags, transfer) => {
    console.log('requesting transfer', `${frameName}-iframe`)
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
        let updatedCb = val => {
            data.removeAll()
            cb(val)
        }
        transacting.captureCallback = updatedCb
        transfer(tags, transacting.idempotent)
    }
}

export const generateTransacted = (cb, apiKey, fee_mode, tags = {}) => {
    return async message => {
        isValidTransaction(data.getToken())

        let transacting = data.getTransactingElement()
        const transactingElement = document.getElementById(transacting)
        transactingElement.idempotencyCallback = () => {
            let updatedCb = val => {
                data.removeAll()
                cb(val)
            }
            transactingElement.captureCallback = updatedCb
            data.removeInitialize()
            transfer(tags, transactingElement.idempotent)
        }

        idempotency(apiKey, fee_mode, message)
    }
}

const createCredentials = async(available, options) => {
    if (available) {

        options.challenge = Uint8Array.from(
            options.challenge,
            c => c.charCodeAt(0))

        options.user.id = Uint8Array.from(
            options.user.id,
            c => c.charCodeAt(0))
        return await navigator.credentials.create({
            publicKey: options
        })
    }

    return {
        type: "unavailable"
    }
}

const attestBrowser = async(challengeOptions) => {
    if (data.isAutofill()) return { type: "autofill" }

    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) return { type: "safari-bypass" }

    if (navigator.credentials && navigator.credentials.preventSilentAccess) {
        try {
            const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
            return await createCredentials(isAvailable, challengeOptions)
        }
        catch {
            return {
                type: "prevented"
            }
        }
    }
}

const sendTransactingMessage = (buyerOptions, env) => {
    const transacting = data.getTransactingElement()
    const types = transacting.includes('-card-') ? data.fieldTypes : transacting.includes('-ach-') ? data.achFieldTypes : data.cashFieldTypes
    types.forEach(field => {
        let iframe = document.getElementsByName(`${field}-iframe`)[0]
        if (iframe) {
            message.postMessageToHostedField(`${field}-iframe`, env, {
                type: "pt-static:transact",
                element: field,
                buyerOptions
            })
        }
    })
}

export const generateInitialization = (handleInitialized, challengeOptions, env) => {
    return async(amount, buyerOptions = {}, confirmation = false) => {
        let initialize = data.getInitialize()
        if (initialize !== 'init') {
            if (!Number.isInteger(amount) && amount < 1) {
                return message.handleError('amount must be a positive integer')
            }

            data.setInitialize('init')
            const attested = await attestBrowser(challengeOptions)

            await handleInitialized(amount, buyerOptions, confirmation)

            const transacting = data.getTransactingElement()
            const attestation = { id: attested.id, response: attested.response, type: attested.type }
            message.postMessageToHostedField(data.hostedFieldMap[transacting], env, {
                type: `pt-static:attestation`,
                attestation
            })

            sendTransactingMessage(buyerOptions, env)
        }
    }
}
