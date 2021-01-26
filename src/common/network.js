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

export const transactionEndpoint = (() => {

    switch (process.env.BUILD_ENV) {
    case 'prod':
        {
            return `https://tags.api.paytheory.com`
        }
    case 'stage':
        {
            return `https://demo.tags.api.paytheorystudy.com`
        }
    default:
        {
            return `https://dev.tags.api.paytheorystudy.com`
        }
    }
})()

export const hostedFieldsEndpoint = (() => {

    switch (process.env.BUILD_ENV) {
    case 'prod':
        {
            return `https://tags.static.paytheory.com`
        }
    case 'stage':
        {
            return `https://demo.tags.static.paytheorystudy.com`
        }
    default:
        {
            return `https://dev.tags.static.paytheorystudy.com`
        }
    }
})()

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

const callIdempotency = async(host, apiKey, fee_mode, message) => {
    const payment = message.tokenize ? message.tokenize : message.transact
    payment.fee_mode = fee_mode
    return await postData(
        `${host}/pt-idempotency`,
        apiKey,
        payment
    )
}

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
        let cbToken

        if (transacting === 'pay-theory-ach-account-number-tag-frame') {
            const token = await idempotency(host, apiKey, fee_mode, message)
            cbToken = {
                "last_four": token.bin.last_four,
                "receipt_number": token.idempotency,
                "amount": token.payment.amount,
                "service_fee": token.payment.service_fee
            }
        }
        else {
            const token = await tokenize(host, apiKey, fee_mode, message)
            cbToken = {
                "first_six": token.bin.first_six,
                "brand": token.bin.brand,
                "receipt_number": token.idempotency,
                "amount": token.payment.amount,
                "service_fee": token.payment.service_fee
            }
        }

        cb(cbToken)
    }
}

const idempotency = async(host, apiKey, fee_mode, message) => {
    if (isValidTransaction(data.getToken())) {

        data.setToken(true)
        let token = await callIdempotency(host, apiKey, fee_mode, message)
        //{"state":"error","reason":"service fee unavailable"}
        // handle error when token fails

        if (token.state === 'error') {
            const transactionalId = data.getTransactingElement()
            const transactionalElement = document.getElementById(transactionalId)
            transactionalElement.error = token.reason
        }
        else {
            data.setToken(token['payment-token'])
            data.setMerchant(token.payment.merchant)
            data.setIdempotency(token)
        }
        return token
    }
    return false
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

const transfer = async(cb, host, apiKey, tags) => {
    const idempotency = data.getIdempotency()
    tags['pt-number'] = idempotency.idempotency

    const token = data.getToken()
    const payload = {
        "payment-token": token,
        tags
    }

    const transfer = await postData(
        `${host}/transfer`,
        apiKey,
        payload,
    )

    data.removeAll()

    cb({
        receipt_number: idempotency.idempotency,
        last_four: idempotency.bin.last_four,
        created_at: transfer.created_at,
        amount: transfer.amount,
        service_fee: transfer.service_fee,
        state: transfer.state === 'PENDING' ? 'APPROVED' : transfer.state === 'error' ? 'FAILURE' : transfer.state,
        tags: transfer.tags,
    })
}

export const generateCapture = (cb, host, apiKey, tags = {}) => {
    return async() => {
        isValidTransaction(data.getIdentity())
        let transacting = data.getTransactingElement()

        if (transacting === 'pay-theory-ach-account-number-tag-frame') {
            await transfer(cb, host, apiKey, tags)
        }
        else {
            await processPayment(cb, host, apiKey, tags = {})
        }
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

        if (transacting === 'pay-theory-ach-account-number-tag-frame') {
            await idempotency(host, apiKey, fee_mode, message)

            await transfer(cb, host, apiKey, tags)
        }
        else {
            await tokenize(host, apiKey, fee_mode, message)

            await processPayment(cb, host, apiKey, tags)
        }
    }
}

export const generateInitialization = (handleInitialized) => {
    return async(amount, buyerOptions = {}, confirmation = false) => {
        if (typeof amount === 'number' && Number.isInteger(amount) && amount > 0) {
            await handleInitialized(amount, buyerOptions, confirmation)
            const transacting = data.getTransactingElement()
            if (transacting === 'pay-theory-ach-account-number-tag-frame') {
                data.achFieldTypes.forEach(field => {
                    document.getElementById(`${field}-iframe`).contentWindow.postMessage({
                            type: "pt-static:transact",
                            element: field,
                            buyerOptions
                        },
                        hostedFieldsEndpoint,
                    );
                })
            }
        }
        else {
            return message.handleError('amount must be a positive integer')
        }
    }
}
