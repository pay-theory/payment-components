import * as messaging from './message'
import {mainStateObject} from "../components/pay-theory-hosted-field-transactional";

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

export const stateObserver = (cb: (value: mainStateObject) => void) => messaging.handleMessage(messaging.stateTypeMessage, cb)

export const validObserver = (cb: (value: string) => void) => messaging.handleMessage(messaging.validTypeMessage, cb)

export const readyObserver = (cb: () => void) => messaging.handleMessage(messaging.readyTypeMessage, cb)

export const tokenizeObserver = (cb: (value: any) => void) => messaging.handleHostedFieldMessage(
    messaging.confirmTypeMessage,
    cb)

export const captureObserver = (cb: (value: any) => void) => messaging.handleHostedFieldMessage(
    messaging.confirmationCompleteTypeMessage,
    cb)

export const transactedObserver = (cb: (value: any) => void) => messaging.handleHostedFieldMessage(
    messaging.completeTypeMessage,
    cb)

export const cardPresentObserver = (cb: (value: any) => void) => messaging.handleHostedFieldMessage(
    messaging.cardPresentTypeMessage, (message: any) => {
        cb(message.body)
    })

// export const generateReturn = (mount,
//                                initTransaction,
//                                transact,
//                                tokenizePaymentMethod,
//                                activateCardPresentDevice,
//                                confirm,
//                                cancel,
//                                readyObserver,
//                                validObserver,
//                                cashObserver,
//                                stateObserver) => Object.create({
//     mount,
//     initTransaction,
//     transact,
//     tokenizePaymentMethod,
//     activateCardPresentDevice,
//     confirm,
//     cancel,
//     readyObserver,
//     errorObserver,
//     validObserver,
//     cashObserver,
//     captureObserver,
//     tokenizeObserver,
//     transactedObserver,
//     stateObserver,
//     cardPresentObserver
// })
