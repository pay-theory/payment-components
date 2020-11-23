import * as messaging from './message'
import * as network from './network'

export const errorObserver = cb => messaging.handleMessage(messaging.errorTypeMessage, message => {
    cb(message.error)
    if (message.throws) {
        throw new Error(message.error)
    }
})


export const tokenizeObserver = (host, apiKey, element, fee_mode) =>
    cb => messaging.handleMessage(
        messaging.tokenizeTypeMessage,
        network.generateTokenize(cb, host, apiKey, element), fee_mode)


export const captureObserver = (host, apiKey, element, tags = {}) =>
    cb => messaging.handleMessage(
        messaging.captureTypeMessage,
        network.generateCapture(cb, host, apiKey, element, tags))

export const transactedObserver = (host, apiKey, element, fee_mode, tags = {}) =>
    cb => messaging.handleMessage(
        messaging.transactedTypeMessage,
        network.generateTransacted(cb, host, apiKey, element, fee_mode, tags))

export const generateReturn = (mount, initTransaction, confirm, cancel, readyObserver, validObserver, sdk, element, tags = {}) => Object.create({
    mount,
    initTransaction,
    confirm,
    cancel,
    readyObserver,
    errorObserver,
    validObserver,
    captureObserver: captureObserver(sdk.host, sdk.apiKey, element),
    tokenizeObserver: tokenizeObserver(sdk.host, sdk.apiKey, element, sdk.fee_mode),
    transactedObserver: transactedObserver(sdk.host, sdk.apiKey, element, sdk.fee_mode, tags),
})
