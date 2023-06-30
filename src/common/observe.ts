import * as messaging from './message'
import {
    CashBarcodeObject,
    ConfirmationObject,
    PayorInfo, PlaceholderObject,
    StateObject,
    TokenizedPaymentMethodObject
} from "./pay_theory_types";
import {FailedTransactionMessage, SuccessfulTransactionMessage} from "./format";
import { transact, cancel, confirm, tokenizePaymentMethod, activateCardPresentDevice} from "../field-set/actions";
import {defaultElementIds, ElementTypes} from "./data";

export const errorObserver = (cb: (error: string) => void) => messaging.handleMessage(messaging.errorTypeMessage, (message: {
    error: string;
    type: string;
}) => {
    cb(message.error)
})

export const stateObserver = (cb: (value: StateObject) => void) => messaging.handleMessage(messaging.stateTypeMessage, (event: {type: string, data: StateObject}) => {
  cb(event.data)
})

export const validObserver = (cb: (value: string) => void) => messaging.handleMessage(messaging.validTypeMessage, (event: { type: string, data: string }) => {
    cb(event.data)
})

export const readyObserver = (cb: (ready: true) => void) => messaging.handleMessage(messaging.readyTypeMessage, () => {
    cb(true)
})

export const tokenizeObserver = (cb: (value: any) => void) => messaging.handleMessage(
    messaging.confirmTypeMessage, (message: {type: string, body: ConfirmationObject}) =>{
        cb(message.body)
    })

export const captureObserver = (cb: (value: any) => void) => messaging.handleMessage(
    messaging.confirmationCompleteTypeMessage, (message: {type: string, body: SuccessfulTransactionMessage | FailedTransactionMessage}) =>{
        cb(message.body)
    })

export const transactedObserver = (cb: (value: any) => void) => messaging.handleMessage(
    messaging.completeTypeMessage, (message: {type: string, body: TokenizedPaymentMethodObject | SuccessfulTransactionMessage | FailedTransactionMessage}) =>{
      cb(message.body)
    })

export const cashObserver = (cb: (value: any) => void) => messaging.handleMessage(
    messaging.cashTypeMessage, (message: {type: string, body: CashBarcodeObject}) => {
        cb(message.body)
    })

export const cardPresentObserver = (cb: (value: any) => void) => messaging.handleHostedFieldMessage(
    messaging.cardPresentTypeMessage, (message: any) => {
        cb(message.body)
    })



export const generateReturn = (mount: (props: {
                                   placeholders?: PlaceholderObject,
                                   elements?: typeof defaultElementIds,
                                   session?: string,
                               }) => Promise<void>,
                               initTransaction: (amount: number, payorInfo: PayorInfo, confirmation: boolean) => void) => {
    return {
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
    }
}
