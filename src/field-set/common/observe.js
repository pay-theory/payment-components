import * as messaging from './message'
import * as network from './network'

export const errorObserver = cb => messaging.handleMessage(messaging.errorTypeMessage, message => cb(message.error))

export const transactedObserver = (host, clientKey, apiKey, tags = {}) =>
    cb => messaging.handleMessage(
        messaging.tokenizedTypeMessage,
        network.generateTransacted(cb, host, clientKey, apiKey, tags))

export const generateReturn = (mount, initTransaction, readyObserver, validObserver, sdk, tags = {}) => Object.create({
    mount,
    initTransaction,
    readyObserver,
    transactedObserver: transactedObserver(sdk.host, sdk.clientKey, sdk.apiKey, tags),
    errorObserver,
    validObserver,
})
