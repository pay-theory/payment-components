/* global navigator */
import * as data from './data'
import {postMessageToHostedField} from './message'
import {findTransactingElement} from "./dom";
import PayTheoryHostedFieldTransactional from "../components/pay-theory-hosted-field-transactional";

export const getData = async(url: string, apiKey: string) => {
    const options: RequestInit = {
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

const PARTNER = process.env.ENV
const STAGE = process.env.STAGE
const TARGET_MODE = process.env.TARGET_MODE
const ENVIRONMENT = `${PARTNER}${TARGET_MODE}`

export const transactionEndpoint = `https://${ENVIRONMENT}.${STAGE}.com/pt-token-service/`

export const hostedFieldsEndpoint = `https://${ENVIRONMENT}.tags.static.${STAGE}.com`

export const hostedCheckoutEndpoint = `https://${ENVIRONMENT}.checkout.${STAGE}.com`

export const fetchPtToken = async(apiKey: string): Promise<{
    'pt-token': string,
    'origin': string,
    'challengeOptions': object
} | false> => {
    for(let i = 0; i < 5; i++) {
        let token = await getData(transactionEndpoint, apiKey)
        if (token['pt-token']) {
            return token
        }
    }
    return false
}

// const createCredentials = async(available, options) => {
//     if (available) {
//
//         options.challenge = Uint8Array.from(
//             options.challenge,
//             c => c.charCodeAt(0))
//
//         options.user.id = Uint8Array.from(
//             options.user.id,
//             c => c.charCodeAt(0))
//         try {
//             return await navigator.credentials.create({
//                 publicKey: options
//             })
//         }
//         catch {
//             return {
//                 type: "failed to create credentials"
//             }
//         }
//     }
//
//     return {
//         type: "unavailable"
//     }
// }
//
// const attestBrowser = async(challengeOptions: any) => {
//     if (data.isAutofill()) return { type: "autofill" }
//
//     if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) return { type: "safari-bypass" }
//
//     if (navigator.credentials && navigator.credentials.preventSilentAccess) {
//         try {
//             const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
//             return await createCredentials(isAvailable, challengeOptions)
//         }
//         catch {
//             return {
//                 type: "prevented"
//             }
//         }
//     }
//
//     return {
//         type: "failed attestation"
//     }
// }
//
export const sendTransactingMessage = (transacting: PayTheoryHostedFieldTransactional) => {
    const types = transacting.fieldTypes
    const processedElements = transacting.processedElements
    types.forEach(field => {
        let iframe = document.getElementsByName(`${field}-iframe`)[0]
        if (iframe) {
            postMessageToHostedField(`${field}-iframe`, {
                type: "pt-static:transact",
                element: field,
                processedElements
            })
        }
    })
}
//
// export const handleAttestation = async (challengeOptions: any) => {
//     const attested = await attestBrowser(challengeOptions)
//
//     if (attested.response) {
//         const transacting = data.getTransactingElement()
//         const response = { clientDataJSON: attested.response.clientDataJSON, attestationObject: attested.response.attestationObject }
//         const attestation = { response, id: attested.id, type: attested.type }
//         postMessageToHostedField(data.hostedFieldMap[transacting], {
//             type: `pt-static:attestation`,
//             attestation
//         })
//     }
// }

// export const generateInitialization = (handleInitialized, challengeOptions) => {
//     return async(inputParameters) => {
//         let {amount, payorInfo, payTheoryData, shippingDetails, customerInfo, metadata = {}, feeMode, confirmation = false} = parseInputParams(inputParameters)
//         // Adding line for backwards compatibility
//         // TODO add some logging to SDK to see usage of deprecated variables and functions
//         payorInfo = payorInfo || customerInfo || shippingDetails || {}
//         let initialize = data.getInitialize()
//         if (initialize !== 'init') {
//             data.setInitialize('init')
//             const success = await handleInitialized(amount, payorInfo, payTheoryData, metadata, feeMode, confirmation)
//             if (success) {
//                 await handleAttestation(challengeOptions)
//                 sendTransactingMessage()
//             }
//         }
//     }
// }
//
// export const generateTokenization = (handleTokenize, challengeOptions) => {
//     return async(inputParameters) => {
//         let {payorInfo = {}, payorId, metadata = {}} = inputParameters
//         let initialize = data.getInitialize()
//         if (initialize !== 'init') {
//             data.setInitialize('init')
//             const success = await handleTokenize(payorInfo, payorId, metadata)
//             if (success) {
//                 await handleAttestation(challengeOptions)
//                 sendTransactingMessage()
//             }
//         }
//     }
// }
//
// export const generateActivation = (handleActivate, challengeOptions) => {
//     return async(inputParameters) => {
//         let initialize = data.getInitialize()
//         if (initialize !== 'init') {
//             data.setInitialize('init')
//             await handleAttestation(challengeOptions)
//             handleActivate(inputParameters)
//         }
//     }
// }