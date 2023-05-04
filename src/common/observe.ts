import * as messaging from './message'
import * as network from './network'

export const errorObserver = (cb: (error: string) => void) => messaging.handleMessage(messaging.errorTypeMessage, (message: {
    error: string;
    throws: boolean;
    type: string;
}) => {
    cb(message.error)
    if (message.throws) {
        throw new Error(message.error)
    }
})

export const stateObserver = () => {

}

export const validObserver = () => {

}

export const tokenizeObserver = (cb: (value: any) => void) => messaging.handleHostedFieldMessage(
    messaging.confirmTypeMessage,
    network.generateTokenize(cb))

export const captureObserver = (cb: (value: any) => void) => messaging.handleHostedFieldMessage(
    messaging.confirmationCompleteTypeMessage,
    network.generateCompletionResponse(cb))

export const transactedObserver = (cb: (value: any) => void) => messaging.handleHostedFieldMessage(
    messaging.completeTypeMessage,
    network.generateCompletionResponse(cb))

export const cardPresentObserver = (cb: (value: any) => void) => messaging.handleHostedFieldMessage(
    messaging.cardPresentTypeMessage, (message: any) => {
        cb(message.body)
    })

export const generateReturn = (mount,
                               initTransaction,
                               transact,
                               tokenizePaymentMethod,
                               activateCardPresentDevice,
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
    activateCardPresentDevice,
    confirm,
    cancel,
    readyObserver,
    errorObserver,
    validObserver,
    cashObserver,
    captureObserver,
    tokenizeObserver,
    transactedObserver,
    stateObserver,
    cardPresentObserver
})
