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

// deprecated environment is always derived from API key
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
            return typeof data.getEnvironment() === 'string' ? data.getEnvironment() : 'dev'
        }
    }
})()

export const transactionEndpoint = () => {
    return `https://${data.getEnvironment()}.token.service.${data.getStage()}.com/${data.getEnvironment()}`
}

export const hostedFieldsEndpoint = () => {
    return `https://${data.getEnvironment()}.tags.static.${data.getStage()}.com`
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

export const generateTokenize = (cb, apiKey, fee_mode) => {
    return async message => {
        let transacting = data.getTransactingElement()
        document.getElementById(transacting).idempotencyCallback = cb
        idempotency(apiKey, fee_mode, message)
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
        try {
            return await navigator.credentials.create({
                publicKey: options
            })
        }
        catch {
            return {
                type: "failed to create credentials"
            }
        }
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

    return {
        type: "failed attestation"
    }
}

const sendTransactingMessage = (buyerOptions) => {
    const transacting = data.getTransactingElement()
    const types = transacting.includes('-card-') ? data.fieldTypes : transacting.includes('-ach-') ? data.achFieldTypes : data.cashFieldTypes
    types.forEach(field => {
        let iframe = document.getElementsByName(`${field}-iframe`)[0]
        if (iframe) {
            message.postMessageToHostedField(`${field}-iframe`, {
                type: "pt-static:transact",
                element: field,
                buyerOptions
            })
        }
    })
}

export const generateInitialization = (handleInitialized, challengeOptions) => {
    return async(amount, buyerOptions = {}, confirmation = false) => {
        let initialize = data.getInitialize()
        if (initialize !== 'init') {
            if (!Number.isInteger(amount) || amount < 1) {
                return message.handleError('amount must be a positive integer')
            }

            data.setInitialize('init')
            const attested = await attestBrowser(challengeOptions)

            await handleInitialized(amount, buyerOptions, confirmation)

            if (attested.response) {
                const transacting = data.getTransactingElement()
                const response = { clientDataJSON: attested.response.clientDataJSON, attestationObject: attested.response.attestationObject }
                const attestation = { response, id: attested.id, type: attested.type }
                message.postMessageToHostedField(data.hostedFieldMap[transacting], {
                    type: `pt-static:attestation`,
                    attestation
                })
            }

            sendTransactingMessage(buyerOptions)
        }
    }
}
