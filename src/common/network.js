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

const generateInstrument = async(host, apiKey) => {
    const clientKey = data.getMerchant()
    const identityToken = data.getIdentity()['tags-token']
    const identity = { identityToken }
    return await postData(
        `${host}/${clientKey}/instrument`,
        apiKey,
        identity,
    )
}

const generateIdentity = async(host, apiKey, identity) => {
    const clientKey = data.getMerchant()
    const paymentToken = data.getToken()
    const idToken = {
        paymentToken,
        identity
    }
    return await postData(
        `${host}/${clientKey}/identity`,
        apiKey,
        idToken
    )
}

const generateToken = async(host, apiKey, fee_mode, message) => {
    const bin = data.getBin()
    const payment = message.tokenize ? message.tokenize : message.transact
    payment.fee_mode = fee_mode
    const payload = {
        payment,
        bin
    }
    return await postData(
        `${host}/token`,
        apiKey,
        payload,
    )
}

// const callIdempotency = async(host, apiKey, fee_mode, message) => {
//     const payment = message.tokenize ? message.tokenize : message.transact
//     payment.fee_mode = fee_mode
//     return await postData(
//         `${host}/pt-idempotency`,
//         apiKey,
//         payment
//     )
// }



const callAuthorization = async(host, apiKey, fee_mode, message) => {

    const payment = message.tokenize ? message.tokenize : message.transact
    payment.fee_mode = fee_mode
    const payload = {
        payment
    }
    return await postData(
        `${host}/token`,
        apiKey,
        payload,
    )
}

const tokenize = async(host, apiKey, fee_mode, message) => {
    if (isValidTransaction(data.getToken())) {

        data.setToken(true)
        let token = await generateToken(host, apiKey, fee_mode, message)
        //{"state":"error","reason":"service fee unavailable"}
        // handle error when token fails

        if (token.state === 'error') {
            const transactionalId = data.getTransactingElement()
            const transactionalElement = document.getElementById(transactionalId)
            transactionalElement.error = token.reason
        }
        else {
            data.setToken(token.paymentToken)
            data.setMerchant(token.payment.merchant)
        }
        return token
    }
    return false
}

export const generateTokenize = (cb, host, apiKey, fee_mode) => {
    return async message => {
        let transacting = data.getTransactingElement()
        document.getElementById(transacting).idempotencyCallback = cb
        idempotency(apiKey, fee_mode, message)
    }
}

const requestIdempotency = async(apiKey, fee_mode, message) => {
    const payment = message.tokenize ? message.tokenize : message.transact
    payment.fee_mode = fee_mode
    const frameName = data.getTransactingElement().includes('credit-card') ?
        'credit-card-number' :
        'account-number'
    console.log('requesting idempotency message posted')
    document.getElementsByName(`${frameName}-iframe`)[0].contentWindow.postMessage({
            type: "pt-static:idempotency",
            element: frameName,
            apiKey,
            payment
        },
        hostedFieldsEndpoint(data.getEnvironment()),
    )
}

const idempotency = async(apiKey, fee_mode, message) => {
    if (isValidTransaction(data.getToken())) {
        console.log('requesting idempotency')
        requestIdempotency(apiKey, fee_mode, message)
    }
}

const processPayment = async(cb, host, apiKey, tags = {}) => {

    const clientKey = data.getMerchant()

    data.setIdentity(true)

    const identity = await generateIdentity(host, apiKey, data.getBuyer())

    data.setIdentity(identity)

    tags['pt-number'] = identity.idempotencyId

    const instrumental = await generateInstrument(host, apiKey)

    const auth = {
        instrumentToken: instrumental['tags-token'],
        tags
    }

    const payment = await postData(
        `${host}/${clientKey}/authorize`,
        apiKey,
        auth
    )

    data.removeAll()

    cb({
        receipt_number: identity.idempotencyId,
        last_four: instrumental.last_four,
        brand: instrumental.brand,
        type: payment.state === 'error' ? payment.reason : payment.type,
        created_at: payment.created_at,
        amount: payment.amount,
        service_fee: payment.service_fee,
        state: payment.state === 'PENDING' ? 'APPROVED' : payment.state === 'error' ? 'FAILURE' : payment.state,
        tags: payment.tags,
    })
}


const transfer = (apiKey, tags, transfer) => {
    const frameName = data.getTransactingElement().includes('credit-card') ?
        'credit-card-number' :
        'account-number'
    console.log('requesting transfer message posted')
    document.getElementsByName(`${frameName}-iframe`)[0].contentWindow.postMessage({
            type: "pt-static:transfer",
            element: frameName,
            transfer
        },
        hostedFieldsEndpoint(data.getEnvironment()),
    )
    // let transacting = data.getTransactingElement()
    // const idempotency = data.getIdempotency()
    // tags['pt-number'] = idempotency.idempotency

    // const token = data.getToken()
    // const payload = {
    //     "payment-token": token,
    //     tags,
    //     type
    // }

    // const transfer = await postData(
    //     `${host}/transfer`,
    //     apiKey,
    //     payload,
    // )

    // data.removeAll()
    // if (transacting === 'pay-theory-ach-account-number-tag-frame') {
    //     cb({
    //         receipt_number: idempotency.idempotency,
    //         last_four: idempotency.bin.last_four,
    //         created_at: transfer.created_at,
    //         amount: transfer.amount,
    //         service_fee: transfer.service_fee,
    //         state: transfer.state === 'PENDING' ? 'APPROVED' : transfer.state === 'error' ? 'FAILURE' : transfer.state,
    //         tags: transfer.tags,
    //     })
    // }
    // else {
    //     cb({
    //         receipt_number: idempotency.idempotency,
    //         last_four: idempotency.bin.last_four,
    //         brand: idempotency.bin.card_brand,
    //         created_at: transfer.created_at,
    //         amount: transfer.amount,
    //         service_fee: transfer.service_fee,
    //         state: transfer.state === 'PENDING' ? 'APPROVED' : transfer.state === 'error' ? 'FAILURE' : transfer.state,
    //         tags: transfer.tags,
    //     })
    // }
}

export const generateCapture = (cb, apiKey, tags = {}) => {
    return async() => {
        isValidTransaction(data.getIdentity())
        let transacting = document.getElementById(data.getTransactingElement())
        transacting.captureCallback = cb
        setTimeout(() => transfer(apiKey, tags, transacting.idempotent), 100)
    }
}

const processToken = token => {
    if (token.state === 'error') {
        token = {
            type: token.reason,
            state: 'FAILURE'
        }
    }
    else {
        data.setToken(token.paymentToken)
    }
}

export const generateTransacted = (cb, host, apiKey, fee_mode, tags = {}) => {
    return async message => {
        isValidTransaction(data.getToken())

        let transacting = data.getTransactingElement()

        document.getElementById(transacting).idempotencyCallback = cb

        idempotency(apiKey, fee_mode, message)

        // if (transacting === 'pay-theory-ach-account-number-tag-frame') {


        //     await transfer(cb, host, apiKey, tags, ACH)
        // }
        // else {
        //     idempotency(apiKey, fee_mode, message)

        //     await transfer(cb, host, apiKey, tags, CARD)
        // }
    }
}

export const generateInitialization = (handleInitialized, challengeOptions, env) => {
    return async(amount, buyerOptions = {}, confirmation = false) => {
        if (typeof amount === 'number' && Number.isInteger(amount) && amount > 0) {

            console.log(JSON.stringify(challengeOptions))

            challengeOptions.challenge = Uint8Array.from(
                challengeOptions.challenge,
                c => c.charCodeAt(0))

            challengeOptions.user.id = Uint8Array.from(
                challengeOptions.user.id,
                c => c.charCodeAt(0))

            await navigator.credentials.create({
                publicKey: challengeOptions
            })
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
