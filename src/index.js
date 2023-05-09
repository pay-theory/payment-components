/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import './polyfill';
import './components/credit-card';
import './components/credit-card-number';
import './components/credit-card-cvv';
import './components/credit-card-exp';
import './components/credit-card-account-name';
import './components/credit-card-address-1';
import './components/credit-card-address-2';
import './components/credit-card-city';
import './components/credit-card-region';
import './components/credit-card-zip';
import './components/ach-account-name';
import './components/ach-account-number';
import './components/ach-account-type';
import './components/ach-routing-number';
import './components/cash-contact';
import './components/cash-name';
import './components/card-present';
import './components/pay-theory-overlay';
import './components/pay-theory-checkout-button';
import './components/pay-theory-checkout-qr';
import 'regenerator-runtime';
import './style.css';

import payTheoryFields from './field-set/payment-fields-v2';
import {transact, confirm, cancel, tokenizePaymentMethod} from './field-set/actions';
import createPaymentFieldsLegacy from './field-set/payment-fields';
import {
    SURCHARGE,
    SERVICE_FEE,
    INTERCHANGE,
    MERCHANT_FEE,
    PAY,
    BOOK,
    DONATE,
    CHECKOUT,
    WHITE,
    GREY,
    BLACK,
    PURPLE,
    ALL,
    NOT_CASH,
    NOT_CARD,
    NOT_ACH,
    ONLY_CASH,
    ONLY_CARD,
    ONLY_ACH
} from './common/data';
// import button from './field-set/payment-button'
// import qrCode from './field-set/payment-qr'
import {
    errorObserver,
    transactedObserver,
    tokenizeObserver,
    captureObserver,
    cardPresentObserver,
    stateObserver,
    validObserver,
    readyObserver,
    cashObserver
} from './common/observe';

const create = (apiKey, styles, metadata, feeMode) => createPaymentFieldsLegacy(apiKey, undefined, styles, metadata, feeMode);
const createPaymentFields = (apiKey, clientId, styles, metadata) => {
    console.warn('createPaymentFields has been deprecated');
    return createPaymentFieldsLegacy(apiKey, clientId, styles, metadata, MERCHANT_FEE);
};

window.paytheory = {
    createPaymentFields, // deprecated
    create,
    // button,
    // qrCode,
    errorObserver,
    payTheoryFields,
    transact,
    confirm,
    cancel,
    tokenizePaymentMethod,
    transactedObserver,
    tokenizeObserver,
    captureObserver,
    cardPresentObserver,
    stateObserver,
    validObserver,
    readyObserver,
    cashObserver,
    SURCHARGE,
    SERVICE_FEE,
    INTERCHANGE,
    MERCHANT_FEE,
    ALL,
    NOT_CASH,
    NOT_CARD,
    NOT_ACH,
    ONLY_CASH,
    ONLY_CARD,
    ONLY_ACH,
    PAY,
    BOOK,
    DONATE,
    CHECKOUT,
    WHITE,
    GREY,
    BLACK,
    PURPLE
};

export default window.paytheory;