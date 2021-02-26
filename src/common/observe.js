import * as messaging from './message'
import * as network from './network'
import * as data from './data'

export const errorObserver = cb => messaging.handleMessage(messaging.errorTypeMessage, message => {
    cb(message.error)
    if (message.throws) {
        throw new Error(message.error)
    }
})


export const tokenizeObserver = (apiKey, fee_mode) =>
    cb => messaging.handleMessage(
        messaging.tokenizeTypeMessage,
        network.generateTokenize(cb, apiKey, fee_mode))


export const captureObserver = (tags = {}) =>
    cb => messaging.handleMessage(
        messaging.captureTypeMessage,
        network.generateCapture(cb, tags))

export const transactedObserver = (apiKey, fee_mode, tags = {}) =>
    cb => messaging.handleMessage(
        messaging.transactedTypeMessage,
        network.generateTransacted(cb, apiKey, fee_mode, tags))

export const generateReturn = (mount, initTransaction, confirm, cancel, readyObserver, validObserver, cashObserver, sdk, tags = {}) => Object.create({
    mount,
    initTransaction,
    confirm,
    cancel,
    readyObserver,
    errorObserver,
    validObserver,
    cashObserver,
    captureObserver: captureObserver(tags),
    tokenizeObserver: tokenizeObserver(sdk.apiKey, sdk.fee_mode),
    transactedObserver: transactedObserver(sdk.apiKey, sdk.fee_mode, tags),
})
