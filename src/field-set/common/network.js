/* global localStorage */
import * as data from './data'
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

export const generateTransacted = (cb, host, clientKey, apiKey, amount) => {
    return async message => {
        const identity = JSON.parse(localStorage.getItem(data.IDENTITY))

        const instrument = await postData(
            `${host}/${clientKey}/instrument`,
            apiKey, {
                token: message.tokenized.data.id,
                type: 'TOKEN',
                identity: identity.id,
                identityToken: identity['tags-token']
            },
        )


        const payment = await postData(
            `${host}/${clientKey}/payment`,
            apiKey, {
                source: instrument.id,
                amount,
                currency: 'USD',
                idempotency_id: identity.idempotencyId,
                identityToken: identity['tags-token'],
                tags: { 'pt-number': identity.idempotencyId },
            },
        )

        localStorage.removeItem(data.IDENTITY)

        cb({
            last_four: instrument.last_four,
            brand: instrument.brand,
            type: payment.state === 'error' ? payment.message : payment.type,
            receipt_number: identity.idempotencyId,
            state: payment.state === 'PENDING' ? 'APPROVED' : payment.state
        })
    }
}

export const generateInitialization = (handleInialized, host, clientKey, apiKey, element) => {
    return async(buyerOptions = {}) => {
        const stored = localStorage.getItem(data.IDENTITY)

        const restore = stored ?
            JSON.parse(stored) :
            false

        const identity = restore ?
            restore :
            await postData(
                `${host}/${clientKey}/identity`,
                apiKey,
                typeof buyerOptions === 'object' ? buyerOptions : {},
            )

        localStorage.setItem(data.IDENTITY, JSON.stringify(identity))

        handleInialized()
    }
}
