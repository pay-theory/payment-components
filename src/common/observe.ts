/* eslint-disable no-unused-vars */

import * as messaging from './message';
import {
  CashBarcodeObject,
  ConfirmationObject,
  FailedTransactionObject,
  PayorInfo,
  PlaceholderObject,
  StateObject,
  SuccessfulTransactionObject,
  TokenizedPaymentMethodObject,
  Transaction,
} from './pay_theory_types';
import {
  transact,
  cancel,
  confirm,
  tokenizePaymentMethod,
  activateCardPresentDevice,
} from '../field-set/actions';
import { defaultElementIds } from './data';

export const errorObserver = (cb: (error: string) => void) =>
  messaging.handleMessage(
    messaging.errorTypeMessage,
    (message: { error: string; type: string }) => {
      cb(message.error);
    },
  );

export const stateObserver = (cb: (value: StateObject) => void) =>
  messaging.handleMessage(
    messaging.stateTypeMessage,
    (event: { type: string; data: StateObject }) => {
      cb(event.data);
    },
  );

export const validObserver = (cb: (value: string) => void) =>
  messaging.handleMessage(messaging.validTypeMessage, (event: { type: string; data: string }) => {
    cb(event.data);
  });

export const readyObserver = (cb: (ready: true) => void) =>
  messaging.handleMessage(messaging.readyTypeMessage, () => {
    cb(true);
  });

/** Observes card details emitted when a transaction requires confirmation. */
export const tokenizeObserver = (cb: (value: ConfirmationObject) => void) =>
  messaging.handleMessage(
    messaging.confirmTypeMessage,
    (message: { type: string; body: ConfirmationObject }) => {
      cb(message.body);
    },
  );

type TransactionObserverValue = SuccessfulTransactionObject | FailedTransactionObject | Transaction;

/** Observes the final transaction body emitted after confirmation. */
export const captureObserver = (cb: (value: TransactionObserverValue) => void) =>
  messaging.handleMessage(
    messaging.confirmationCompleteTypeMessage,
    (message: { type: string; body: TransactionObserverValue }) => {
      cb(message.body);
    },
  );

/** Observes completed transaction and tokenization bodies. */
export const transactedObserver = (
  cb: (value: TokenizedPaymentMethodObject | TransactionObserverValue) => void,
) =>
  messaging.handleMessage(
    messaging.completeTypeMessage,
    (message: { type: string; body: TokenizedPaymentMethodObject | TransactionObserverValue }) => {
      cb(message.body);
    },
  );

/** Observes cash barcode results. */
export const cashObserver = (cb: (value: CashBarcodeObject) => void) =>
  messaging.handleMessage(
    messaging.cashTypeMessage,
    (message: { type: string; body: CashBarcodeObject }) => {
      cb(message.body);
    },
  );

// export const cardPresentObserver = (cb: (value: any) => void) =>
//   messaging.handleHostedFieldMessage(messaging.cardPresentTypeMessage, (message: any) => {
//     cb(message.body);
//   });

/** Builds the backwards-compatible controller returned by the legacy creation APIs. */
export const generateReturn = (
  mount: (props: {
    placeholders?: PlaceholderObject;
    elements?: typeof defaultElementIds;
    session?: string;
  }) => Promise<void>,
  initTransaction: (amount: number, payorInfo: PayorInfo, confirmation?: boolean) => void,
) => {
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
  };
};
