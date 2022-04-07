import * as messaging from './message'
import * as network from './network'
import * as data from './data'

export const errorObserver = cb => messaging.handleMessage(messaging.errorTypeMessage, message => {
    cb(message.error)
    data.removeInitialize()
    if (message.throws) {
        throw new Error(message.error)
    }
})

export const tokenizeObserver = cb => messaging.handleHostedFieldMessage(
        messaging.idempotencyTypeMessage,
        network.generateTokenize(cb))

export const captureObserver = cb => messaging.handleHostedFieldMessage(
        messaging.confirmationCompleteTypeMessage,
        network.generateCompletetionResponse(cb))

export const transactedObserver = cb => messaging.handleHostedFieldMessage(
        messaging.transferCompleteTypeMessage,
        network.generateCompletetionResponse(cb))

export const generateReturn = ( mount,
        initTransaction,
        transact,
        confirm,
        cancel,
        readyObserver,
        validObserver,
        cashObserver) => Object.create({
    mount,
    initTransaction,
    transact,
    confirm,
    cancel,
    readyObserver,
    errorObserver,
    validObserver,
    cashObserver,
    captureObserver,
    tokenizeObserver,
    transactedObserver
})
