import * as messaging from './message'
import * as network from './network'

export const errorObserver = cb => messaging.handleMessage(messaging.errorTypeMessage, message => {
    cb(message.error)
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
        confirm,
        cancel,
        readyObserver,
        validObserver,
        cashObserver) => Object.create({
    mount,
    initTransaction,
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
