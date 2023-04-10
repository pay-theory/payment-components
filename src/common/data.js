/* global localStorage */
export const AUTOFILL = 'pt-autofill'
export const READY = 'pt-ready'
export const TRANSACTING = 'pt-transacting'
export const ENVIRONMENT = 'pt-environment'
export const STAGE = 'pt-stage'
export const INITIALIZE = 'pt-initialize'
export const SESSION = 'pt-session'
export const BUTTON_SUCCESS = 'pt-button-success'
export const BUTTON_BARCODE = 'pt-button-barcode'

export const defaultStyles = {
    default: {},
    success: {},
    error: {},
}
export const SURCHARGE = 'merchant_fee'
export const INTERCHANGE = 'merchant_fee'
export const MERCHANT_FEE = 'merchant_fee'
export const SERVICE_FEE = 'service_fee'

export const defaultFeeMode = SURCHARGE

// Call to action constants for the hosted checkout and button
export const PAY = 'PAY'
export const BOOK = 'BOOK'
export const DONATE = 'DONATE'
export const CHECKOUT = 'CHECKOUT'

export const CTA_TYPES = [PAY, BOOK, DONATE]

// Available Payment Method Constants for the hosted checkout
export const ALL = 'ALL'
export const NOT_CASH = 'NOT_CASH'
export const NOT_CARD = 'NOT_CARD'
export const NOT_ACH = 'NOT_ACH'
export const ONLY_CASH = 'ONLY_CASH'
export const ONLY_CARD = 'ONLY_CARD'
export const ONLY_ACH = 'ONLY_ACH'

// Color constants for the button
export const WHITE = 'white'
export const BLACK = 'black'
export const GREY = 'grey'
export const PURPLE = 'purple'

export const PAYMENT_METHOD_CONFIGS = [ALL, NOT_CASH, NOT_CARD, NOT_ACH, ONLY_CASH, ONLY_CARD, ONLY_ACH]


export const initialState = {
    isDirty: false,
    isFocused: false,
    errorMessages: []
}

export const fields = {
    CREDIT_CARD: 'pay-theory-credit-card',
    CREDIT_CARD_NUMBER: 'pay-theory-credit-card-number',
    CREDIT_CARD_EXP: 'pay-theory-credit-card-exp',
    CREDIT_CARD_CVV: 'pay-theory-credit-card-cvv',
    CREDIT_CARD_NAME: 'pay-theory-credit-card-account-name',
    CREDIT_CARD_ADDRESS1: 'pay-theory-credit-card-address-1',
    CREDIT_CARD_ADDRESS2: 'pay-theory-credit-card-address-2',
    CREDIT_CARD_CITY: 'pay-theory-credit-card-city',
    CREDIT_CARD_STATE: 'pay-theory-credit-card-state',
    CREDIT_CARD_ZIP: 'pay-theory-credit-card-zip',
}

export const achFields = {
    ACCOUNT_NUMBER: 'pay-theory-ach-account-number',
    ACCOUNT_TYPE: 'pay-theory-ach-account-type',
    ACCOUNT_NAME: 'pay-theory-ach-account-name',
    BANK_CODE: 'pay-theory-ach-routing-number'
}

export const cashFields = {
    NAME: 'pay-theory-cash-name',
    CONTACT: 'pay-theory-cash-contact'
}

export const cardPresentFields = {
    CARD_PRESENT: 'pay-theory-card-present'
}

export const checkoutButtonField = 'pay-theory-checkout-button'
export const checkoutQRField = 'pay-theory-checkout-qr'
export const payTheoryOverlay = 'pay-theory-overlay'

export const achFieldTypes = [
    'account-name',
    'account-type',
    'account-number',
    'routing-number'
]

export const cashFieldTypes = [
    'cash-name',
    'cash-contact'
]

export const cardPresentFieldTypes = [
    'card-present'
]

export const fieldTypes = [
    'credit-card',
    'card-number',
    'card-cvv',
    'card-exp',
    'card-name',
    'billing-line1',
    'billing-line2',
    'billing-city',
    'billing-state',
    'billing-zip'
]

export const ACH_IFRAME = 'account-number-iframe'
export const CARD_IFRAME = 'card-number-iframe'
export const CASH_IFRAME = 'cash-name-iframe'

export const hostedFieldMap = {
    'pay-theory-ach-account-number-tag-frame': ACH_IFRAME,
    'pay-theory-cash-name-tag-frame': CASH_IFRAME,
    'pay-theory-credit-card-tag-frame': CARD_IFRAME,
    'pay-theory-credit-card-number-tag-frame': CARD_IFRAME,
    'cash': CASH_IFRAME,
    'card': CARD_IFRAME,
    'ach': ACH_IFRAME
}

const isCardField = string => string.startsWith("card") || string.startsWith('billing')
const isCashField = string => string.startsWith("cash")
const isACHField = string => string.startsWith("account") || string.startsWith('routing')

const isFieldType = type => {
    if (isCardField(type)) return 'card'
    if (isCashField(type)) return 'cash'
    if (isACHField(type)) return 'ach'
    return false
}

const combinedCardTypes = ['card-number', 'card-cvv', 'card-exp']

export {
    isCardField,
    isACHField,
    isCashField,
    isFieldType,
    combinedCardTypes
}

const getLocalStorage = key => () => {
    try {
        return localStorage.getItem(key)
    } catch (e) {
        window.postMessage({
                type: 'pt:error',
                throws: true,
                error: "LOCAL_STORAGE_ERROR: Error getting data from local storage",
            },
            window.location.origin,
        );
    }
}

const setLocalStorage = key => value => {
    try {
        return localStorage.setItem(key, value)
    } catch (e) {
        window.postMessage({
                type: 'pt:error',
                throws: true,
                error: "LOCAL_STORAGE_ERROR: Error setting data in local storage",
            },
            window.location.origin,
        );
    }
}

const removeLocalStorage = key => () => {
    try {
        return localStorage.removeItem(key)
    } catch (e) {
        window.postMessage({
                type: 'pt:error',
                throws: true,
                error: "LOCAL_STORAGE_ERROR: Error removing data from local storage",
            },
            window.location.origin,
        );
    }
}

export const isAutofill = getLocalStorage(AUTOFILL)
export const setAutofill = setLocalStorage(AUTOFILL)
export const removeAutofill = removeLocalStorage(AUTOFILL)

export const getTransactingElement = getLocalStorage(TRANSACTING)
export const setTransactingElement = element => {
    return setLocalStorage(TRANSACTING)(element.id)
}
export const removeTransactingElement = removeLocalStorage(TRANSACTING)

export const getEnvironment = getLocalStorage(ENVIRONMENT)
export const setEnvironment = setLocalStorage(ENVIRONMENT)

export const getStage = getLocalStorage(STAGE)
export const setStage = setLocalStorage(STAGE)

export const getReady = getLocalStorage(READY)
export const setReady = setLocalStorage(READY)
export const removeReady = removeLocalStorage(READY)

export const getInitialize = getLocalStorage(INITIALIZE)
export const setInitialize = setLocalStorage(INITIALIZE)
export const removeInitialize = removeLocalStorage(INITIALIZE)

export const getSession = getLocalStorage(SESSION)
export const setSession = setLocalStorage(SESSION)
export const removeSession = removeLocalStorage(SESSION)

export const setButtonSuccess = setLocalStorage(BUTTON_SUCCESS)
export const getButtonSuccess = getLocalStorage(BUTTON_SUCCESS)
export const removeButtonSuccess = removeLocalStorage(BUTTON_SUCCESS)

export const setButtonBarcode = setLocalStorage(BUTTON_BARCODE)
export const getButtonBarcode = getLocalStorage(BUTTON_BARCODE)
export const removeButtonBarcode = removeLocalStorage(BUTTON_BARCODE)


export const removeAll = (allowRetry) => {
    removeAutofill()
    removeTransactingElement()
    removeSession()
    removeButtonSuccess()
    removeButtonBarcode()
    if(allowRetry) removeInitialize()
}