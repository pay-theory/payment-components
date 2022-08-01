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
        messaging.confirmTypeMessage,
        network.generateTokenize(cb))

export const captureObserver = cb => messaging.handleHostedFieldMessage(
        messaging.confirmationCompleteTypeMessage,
        network.generateCompletionResponse(cb))

export const transactedObserver = cb => messaging.handleHostedFieldMessage(
        messaging.completeTypeMessage,
        network.generateCompletionResponse(cb))

export const generateReturn = ( mount,
        initTransaction,
        transact,
        tokenizePaymentMethod,
        confirm,
        cancel,
        readyObserver,
        validObserver,
        cashObserver,
        stateObserver) => Object.create({
    mount,
    initTransaction,
    transact,
    tokenizePaymentMethod,
    confirm,
    cancel,
    readyObserver,
    errorObserver,
    validObserver,
    cashObserver,
    captureObserver,
    tokenizeObserver,
    transactedObserver,
    stateObserver
})
