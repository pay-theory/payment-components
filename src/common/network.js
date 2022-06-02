/* global navigator */
import * as data from './data'
import * as message from './message'

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
        let paymentType = message.paymentType
        let cbToken

        if(paymentType === 'recurring') {
            cbToken = {
                "first_six": message.payment.first_six,
                "last_four": message.payment.last_four,
                "brand": message.payment.brand,
                "receipt_number": message.payment.idempotency,
                "amount": message.payment.amount,
                "service_fee": message.payment.service_fee
            }
        } else {
            cbToken = {
                "first_six": message.payment.first_six,
                "last_four": message.payment.last_four,
                "brand": message.payment.brand,
                "receipt_number": message.payment.idempotency,
                "amount": message.payment.amount,
                "service_fee": message.payment.service_fee
            }
        }

        cb(cbToken)
    }
}

export const generateCompletionResponse = (cb) => {
    return async message => {
        let paymentType = message.paymentType
        let cbToken

        if (paymentType === 'recurring') {
            cbToken = {
                "receipt_number": message.transfer.receipt_number,
                "last_four": message.transfer.last_four,
                "brand": message.transfer.brand,
                "created_at": message.transfer.created_at,
                "amount": message.transfer.amount,
                "service_fee": message.transfer.service_fee,
                "state": message.transfer.state,
                // Keeping tags in the response for backwards compatibility
                "tags": message.transfer.metadata,
                "metadata": message.transfer.metadata
            }
        } else if(message.transfer.state !== "FAILURE") {
            cbToken = {
                "receipt_number": message.transfer.receipt_number,
                "last_four": message.transfer.last_four,
                "brand": message.transfer.brand,
                "created_at": message.transfer.created_at,
                "amount": message.transfer.amount,
                "service_fee": message.transfer.service_fee,
                "state": message.transfer.state,
                // Keeping tags in the response for backwards compatibility
                "tags": message.transfer.metadata,
                "metadata": message.transfer.metadata
            }
        } else {
            cbToken = {
                "receipt_number": message.transfer.receipt_number,
                "last_four": message.transfer.last_four,
                "brand": message.transfer.brand,
                "state": message.transfer.state,
                "type": message.transfer.type
            }
        }
        cb(cbToken)
        data.removeAll()
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
