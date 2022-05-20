/* global navigator */
import * as data from './data'
import * as message from './message'
import { validate } from '../field-set/validation'
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
            cb(val)
            data.removeAll()
        }
        if(transacting) {
            transacting.captureCallback = updatedCb
            transacting.transfer = message.transfer
        }
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

const sendTransactingMessage = () => {
    const transacting = data.getTransactingElement()
    const types = transacting.includes('-card-') ? data.fieldTypes : transacting.includes('-ach-') ? data.achFieldTypes : data.cashFieldTypes
    types.forEach(field => {
        let iframe = document.getElementsByName(`${field}-iframe`)[0]
        if (iframe) {
            message.postMessageToHostedField(`${field}-iframe`, {
                type: "pt-static:transact",
                element: field
            })
        }
    })
}

const handleAttestation = async challengeOptions => {
    const attested = await attestBrowser(challengeOptions)

    if (attested.response) {
        const transacting = data.getTransactingElement()
        const response = { clientDataJSON: attested.response.clientDataJSON, attestationObject: attested.response.attestationObject }
        const attestation = { response, id: attested.id, type: attested.type }
        message.postMessageToHostedField(data.hostedFieldMap[transacting], {
            type: `pt-static:attestation`,
            attestation
        })
    }
}

export const generateInitialization = (handleInitialized, challengeOptions) => {
    return async(inputParameters) => {
        let {amount, customerInfo, shippingDetails, metadata = {}, confirmation = false} = inputParameters
        // Adding line for backwards compatibility
        // TODO add some logging to SDK to see usage of deprecated variables and functions
        customerInfo = customerInfo ? customerInfo : shippingDetails ? shippingDetails : {}
        let initialize = data.getInitialize()
        if (initialize !== 'init') {

            data.setInitialize('init')
            const success = await handleInitialized(amount, customerInfo, metadata, confirmation)
            if (success) {
                await handleAttestation(challengeOptions)
                sendTransactingMessage()
            }
        }
    }
}

export const generateRecurring = (handleRecurring, challengeOptions) => {
    return async(inputParameters) => {
        let {amount, customerInfo, metadata = {}, confirmation = false, recurringSettings} = inputParameters
        //Make sure that we have the base required settings
        if (!validate(amount, 'number') || !validate(recurringSettings, 'object') || !validate(customerInfo, 'object')) {
            const missing = `${!validate(amount, 'number') ? 'amount' : ''}${!validate(recurringSettings, 'object') ? 'recurringSettings' : ''}${!validate(customerInfo, 'object') ? 'customerInfo' : ''}`
            return message.handleError('Some required fields are missing or invalid: ' + missing)
        }
        let initialize = data.getInitialize()
        if (initialize !== 'init') {

            data.setInitialize('init')
            const success = await handleRecurring(amount, customerInfo, metadata, confirmation, recurringSettings)
            if(success) {
                await handleAttestation(challengeOptions)
                sendTransactingMessage()
            }
        }
    }
}
