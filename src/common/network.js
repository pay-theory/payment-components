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
        const fee = message.payment.fee_mode === data.SERVICE_FEE ? message.payment.fee : 0
        let cbToken = {
                "first_six": message.payment.first_six,
                "last_four": message.payment.last_four,
                "brand": message.payment.brand,
                "receipt_number": message.payment.idempotency,
                "amount": message.payment.amount,
                "service_fee": fee
            }

        cb(cbToken)
    }
}

export const generateCompletionResponse = (cb) => {
    return async message => {
        let paymentType = message.paymentType
        let cbToken

        if (paymentType === 'tokenize') {
            cbToken = message.body
        } else if(message.body.state !== "FAILURE") {
            cbToken = {
                "receipt_number": message.body.receipt_number,
                "last_four": message.body.last_four,
                "brand": message.body.brand,
                "created_at": message.body.created_at,
                "amount": message.body.amount,
                "service_fee": message.body.service_fee,
                "state": message.body.state,
                // Keeping tags in the response for backwards compatibility
                "tags": message.body.metadata,
                "metadata": message.body.metadata,
                "payor_id": message.body.payor_id,
                "payment_method_id": message.body.payment_method_id
            }
        } else {
            cbToken = {
                "receipt_number": message.body.receipt_number,
                "last_four": message.body.last_four,
                "brand": message.body.brand,
                "state": message.body.state,
                "type": message.body.type,
                "payor_id": message.body.payor_id,
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

const parseInputParams = (inputParams) => {
    let { payorId, invoiceId, recurringId, fee, metadata = {} } = inputParams
    let payTheoryData = {
        account_code: inputParams.accountCode || metadata["pay-theory-account-code"],
        reference: inputParams.reference || metadata["pay-theory-reference"],
        payment_parameters: inputParams.paymentParameters || metadata["payment-parameters-name"],
        payor_id: payorId,
        send_receipt: inputParams.sendReceipt || metadata["pay-theory-receipt"],
        receipt_description: inputParams.receiptDescription || metadata["pay-theory-receipt-description"],
        invoice_id: invoiceId,
        recurring_id: recurringId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        fee: fee
    }
    inputParams.payTheoryData = payTheoryData
    return inputParams
}

export const generateInitialization = (handleInitialized, challengeOptions) => {
    return async(inputParameters) => {
        let {amount, payorInfo, payTheoryData, shippingDetails, customerInfo, metadata = {}, feeMode, confirmation = false} = parseInputParams(inputParameters)
        // Adding line for backwards compatibility
        // TODO add some logging to SDK to see usage of deprecated variables and functions
        payorInfo = payorInfo || customerInfo || shippingDetails || {}
        let initialize = data.getInitialize()
        if (initialize !== 'init') {
            data.setInitialize('init')
            const success = await handleInitialized(amount, payorInfo, payTheoryData, metadata, feeMode, confirmation)
            if (success) {
                await handleAttestation(challengeOptions)
                sendTransactingMessage()
            }
        }
    }
}

export const generateTokenization = (handleTokenize, challengeOptions) => {
    return async(inputParameters) => {
        let {payorInfo = {}, payorId, metadata = {}} = inputParameters
        let initialize = data.getInitialize()
        if (initialize !== 'init') {
            data.setInitialize('init')
            const success = await handleTokenize(payorInfo, payorId, metadata)
            if (success) {
                await handleAttestation(challengeOptions)
                sendTransactingMessage()
            }
        }
    }
}