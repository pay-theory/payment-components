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
        const token = await tokenize(host, apiKey, fee_mode, message)

        cb({
            "first_six": token.bin.first_six,
            "brand": token.bin.brand,
            "receipt_number": token.idempotency,
            "amount": token.payment.amount,
            "service_fee": token.payment.service_fee
        })
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

export const generateCapture = (cb, host, apiKey, tags = {}) => {
    return async() => {
        isValidTransaction(data.getIdentity())
        await processPayment(cb, host, apiKey, tags = {})
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

        await tokenize(host, apiKey, fee_mode, message)

        await processPayment(cb, host, apiKey, tags)
    }
}

export const generateInitialization = (handleInitialized) => {
    return async(amount, buyerOptions = {}, confirmation = false) => {
        if (typeof amount === 'number' && Number.isInteger(amount) && amount > 0) {
            handleInitialized(amount, buyerOptions, confirmation)
        }
        else {
            return message.handleError('amount must be a positive integer')
        }
    }
}
