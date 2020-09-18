import * as messaging from './message'
import * as network from './network'

export const errorObserver = cb => messaging.handleMessage(messaging.errorTypeMessage, message => cb(message.error))


export const tokenizeObserver = (host, clientKey, apiKey) =>
    cb => messaging.handleMessage(
        messaging.tokenizeTypeMessage,
        network.generateTokenize(cb, host, clientKey, apiKey))


export const captureObserver = (host, clientKey, apiKey, tags = {}) =>
    cb => messaging.handleMessage(
        messaging.captureTypeMessage,
        network.generateCapture(cb, host, clientKey, apiKey, tags))

export const transactedObserver = (host, clientKey, apiKey, tags = {}) =>
    cb => messaging.handleMessage(
        messaging.transactedTypeMessage,
        network.generateTransacted(cb, host, clientKey, apiKey, tags))

export const generateReturn = (mount, initTransaction, confirm, readyObserver, validObserver, sdk, tags = {}) => Object.create({
    mount,
    initTransaction,
    confirm,
    readyObserver,
    errorObserver,
    validObserver,
    captureObserver: captureObserver(sdk.host, sdk.clientKey, sdk.apiKey),
    tokenizeObserver: tokenizeObserver(sdk.host, sdk.clientKey, sdk.apiKey),
    transactedObserver: transactedObserver(sdk.host, sdk.clientKey, sdk.apiKey, tags),
})
