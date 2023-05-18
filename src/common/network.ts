/* global navigator */
import {postMessageToHostedField} from './message'
import PayTheoryHostedFieldTransactional from "../components/pay-theory-hosted-field-transactional";
import {BillingInfo} from "./pay_theory_types";
import {ErrorMessage, FieldsReadyMessage} from "./format";
import {ACH_IFRAME, CARD_IFRAME, CASH_IFRAME} from "./data";

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


export const sendTransactingMessage = (transacting: PayTheoryHostedFieldTransactional, billingInfo: BillingInfo) => new Promise<ErrorMessage | FieldsReadyMessage>((resolve, reject) => {
    // Opening a new message channel, so we can await the response from the hosted field
    const channel = new MessageChannel()

    channel.port1.onmessage = ({data}) => {
        channel.port1.close();
        if (data.error) {
            reject(data);
        } else {
            resolve(data);
        }
    };

    const types = transacting.fieldTypes
    types.forEach(field => {
        let iframeId = `${field}-iframe`
        let iframe = document.getElementsByName(iframeId)[0]
        if (iframe) {
            if([CASH_IFRAME, ACH_IFRAME, CARD_IFRAME].includes(iframeId)) {
                // Only send the port to the transacting element for the async message
                postMessageToHostedField(`${field}-iframe`, {
                    type: "pt-static:transact",
                    element: field,
                    billingInfo
                }, channel.port2)
            } else {
                postMessageToHostedField(`${field}-iframe`, {
                    type: "pt-static:transact",
                    element: field
                })
            }
        }
    })
})

