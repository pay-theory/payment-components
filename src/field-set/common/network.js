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


const generateInstrument = async(host, clientKey, apiKey, message) => {
    const identity = data.getIdentity()

    return await postData(
        `${host}/${clientKey}/instrument`,
        apiKey, {
            token: message.tokenize.token.data.id,
            type: 'TOKEN',
            identity: identity.id,
            identityToken: identity['tags-token']
        },
    )
}

export const generateTokenize = (cb, host, clientKey, apiKey, tags = {}) => {
    return async message => {
        const identity = data.getIdentity()

        const instrument = await generateInstrument(host, clientKey, apiKey, message)

        let setting = {
            instrument: instrument.id,
            last_four: instrument.last_four,
            brand: instrument.brand,
            idempotencyId: identity.idempotencyId,
            identityToken: instrument['tags-token'],
            amount: message.tokenize.amount
        }

        if (instrument.state === 'error') {
            setting = {
                type: instrument.reason,
                state: 'FAILURE'
            }
            data.removeIdentity()
        }
        else {
            data.setInstrument(setting)
        }

        cb(setting)
    }
}

export const generateCapture = (cb, host, clientKey, apiKey, tags = {}) => {
    return async() => {
        const instrumental = data.getInstrument()
        const identity = data.getIdentity()

        tags['pt-number'] = identity.idempotencyId


        const payment = await postData(
            `${host}/${clientKey}/authorize`,
            apiKey, {
                source: instrumental.instrument,
                amount: instrumental.amount,
                currency: 'USD',
                idempotency: identity.idempotencyId,
                identityToken: instrumental.identityToken,
                tags: tags,
            },
        )

        data.removeInstrument()
        data.removeIdentity()

        cb({
            receipt_number: instrumental.idempotencyId,
            last_four: instrumental.instrument.last_four,
            brand: instrumental.instrument.brand,
            type: payment.state === 'error' ? payment.reason : payment.type,
            created_at: payment.created_at,
            amount: payment.amount,
            state: payment.state === 'PENDING' ? 'APPROVED' : payment.state === 'error' ? 'FAILURE' : payment.state,
            tags: payment.tags,
        })
    }
}

export const generateTransacted = (cb, host, clientKey, apiKey, tags = {}) => {
    return async message => {
        const identity = data.getIdentity()

        const instrument = await postData(
            `${host}/${clientKey}/instrument`,
            apiKey, {
                token: message.transact.token.data.id,
                type: 'TOKEN',
                identity: identity.id,
                identityToken: identity['tags-token']
            },
        )

        tags['pt-number'] = identity.idempotencyId

        const payment = await postData(
            `${host}/${clientKey}/authorize`,
            apiKey, {
                source: instrument.id,
                amount: message.transact.amount,
                currency: 'USD',
                idempotency: identity.idempotencyId,
                identityToken: identity['tags-token'],
                tags: tags,
            },
        )

        data.removeIdentity()

        cb({
            receipt_number: identity.idempotencyId,
            last_four: instrument.last_four,
            brand: instrument.brand,
            type: payment.state === 'error' ? payment.reason : payment.type,
            created_at: payment.created_at,
            amount: payment.amount,
            state: payment.state === 'PENDING' ? 'APPROVED' : payment.state === 'error' ? 'FAILURE' : payment.state,
            tags: payment.tags,
        })
    }
}

export const generateInitialization = (handleInitialized, host, clientKey, apiKey) => {
    return async(amount, buyerOptions = {}, confirmation = false) => {
        if (typeof amount === 'number' && Number.isInteger(amount) && amount > 0) {
            const stored = data.getIdentity()

            const restore = stored ?
                stored :
                false

            const identity = restore ?
                restore :
                await postData(
                    `${host}/${clientKey}/identity`,
                    apiKey,
                    typeof buyerOptions === 'object' ? buyerOptions : {},
                )

            data.setIdentity(identity)

            handleInitialized(amount, confirmation)
        }
        else {
            throw Error('amount must be a positive integer')
        }
    }
}
