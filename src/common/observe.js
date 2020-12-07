import * as messaging from './message'
import * as network from './network'

export const errorObserver = cb => messaging.handleMessage(messaging.errorTypeMessage, message => {
    cb(message.error)
    if (message.throws) {
        throw new Error(message.error)
    }
})


export const tokenizeObserver = (host, apiKey, fee_mode) =>
    cb => messaging.handleMessage(
        messaging.tokenizeTypeMessage,
        network.generateTokenize(cb, host, apiKey, fee_mode))


export const captureObserver = (host, apiKey, tags = {}) =>
    cb => messaging.handleMessage(
        messaging.captureTypeMessage,
        network.generateCapture(cb, host, apiKey, tags))

export const transactedObserver = (host, apiKey, fee_mode, tags = {}) =>
    cb => messaging.handleMessage(
        messaging.transactedTypeMessage,
        network.generateTransacted(cb, host, apiKey, fee_mode, tags))

export const generateReturn = (mount, initTransaction, confirm, cancel, readyObserver, validObserver, sdk, tags = {}) => Object.create({
    mount,
    initTransaction,
    confirm,
    cancel,
    readyObserver,
    errorObserver,
    validObserver,
    captureObserver: captureObserver(sdk.host, sdk.apiKey),
    tokenizeObserver: tokenizeObserver(sdk.host, sdk.apiKey, sdk.fee_mode),
    transactedObserver: transactedObserver(sdk.host, sdk.apiKey, sdk.fee_mode, tags),
})
