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
            'x-api-key': apiKey
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
    return `https://${data.getEnvironment()}.${data.getStage()}.com/pt-token-service/`
}

export const hostedFieldsEndpoint = () => {
    return `https://${data.getEnvironment()}.tags.static.${data.getStage()}.com`
}

export const generateTokenize = (cb) => {
    return async message => {
        let transacting = data.getTransactingElement()
        document.getElementById(transacting).idempotencyCallback = cb
        document.getElementById(transacting).idempotent = message.payment
    }
}

export const generateCompletetionResponse = (cb) => {
    return async message => {
        let transacting = document.getElementById(data.getTransactingElement())
        let updatedCb = val => {
            data.removeAll()
            cb(val)
        }
        transacting.captureCallback = updatedCb
        transacting.transfer = message.transfer
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

const sendTransactingMessage = (shippingDetails, transactionTags) => {
    const transacting = data.getTransactingElement()
    const types = transacting.includes('-card-') ? data.fieldTypes : transacting.includes('-ach-') ? data.achFieldTypes : data.cashFieldTypes
    types.forEach(field => {
        let iframe = document.getElementsByName(`${field}-iframe`)[0]
        if (iframe) {
            message.postMessageToHostedField(`${field}-iframe`, {
                type: "pt-static:transact",
                element: field,
                shippingDetails,
                transactionTags
            })
        }
    })
}

export const generateInitialization = (handleInitialized, challengeOptions) => {
    return async(amount, shippingDetails = {}, transactionTags = {}, confirmation = false) => {
        let initialize = data.getInitialize()
        if (initialize !== 'init') {
            if (!Number.isInteger(amount) || amount < 1) {
                return message.handleError('amount must be a positive integer')
            }

            data.setInitialize('init')
            const attested = await attestBrowser(challengeOptions)

            await handleInitialized(amount, shippingDetails, confirmation)

            if (attested.response) {
                const transacting = data.getTransactingElement()
                const response = { clientDataJSON: attested.response.clientDataJSON, attestationObject: attested.response.attestationObject }
                const attestation = { response, id: attested.id, type: attested.type }
                message.postMessageToHostedField(data.hostedFieldMap[transacting], {
                    type: `pt-static:attestation`,
                    attestation
                })
            }

            sendTransactingMessage(shippingDetails, transactionTags)
        }
    }
}
