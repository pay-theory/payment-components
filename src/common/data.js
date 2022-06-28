/* global localStorage */
export const AUTOFILL = 'pt-autofill'
export const READY = 'pt-ready'
export const TRANSACTING = 'pt-transacting'
export const ENVIRONMENT = 'pt-environment'
export const STAGE = 'pt-stage'
export const INITIALIZE = 'pt-initialize'
export const defaultStyles = {
    default: {},
    success: {},
    error: {},
}
export const SURCHARGE = 'interchange'
export const INTERCHANGE = 'interchange'
export const SERVICE_FEE = 'service_fee'

export const defaultFeeMode = SURCHARGE

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

export const isAutofill = () => {
    return localStorage.getItem(AUTOFILL)
}
export const setAutofill = isAutofill => {
    return localStorage.setItem(AUTOFILL, isAutofill)
}
export const removeAutofill = () => {
    return localStorage.removeItem(AUTOFILL)
}
export const getTransactingElement = () => {
    return localStorage.getItem(TRANSACTING)
}
export const setTransactingElement = element => {
    return localStorage.setItem(TRANSACTING, element.id)
}
export const removeTransactingElement = () => {
    return localStorage.removeItem(TRANSACTING)
}
export const getEnvironment = () => {
    return localStorage.getItem(ENVIRONMENT)
}
export const setEnvironment = environment => {
    return localStorage.setItem(ENVIRONMENT, environment)
}
export const getStage = () => {
    return localStorage.getItem(STAGE)
}

export const getFinixEnv = () => {
    return localStorage.getItem(STAGE) === 'paytheory' ? 'live' : 'sandbox'
}

export const setStage = stage => {
    return localStorage.setItem(STAGE, stage)
}
export const getReady = () => {
    return localStorage.getItem(READY)
}
export const setReady = ready => {
    return localStorage.setItem(READY, ready)
}
export const removeReady = () => {
    return localStorage.removeItem(READY)
}

export const getInitialize = () => {
    return localStorage.getItem(INITIALIZE)
}

export const setInitialize = init => {
    return localStorage.setItem(INITIALIZE, init)
}

export const removeInitialize = () => {
    return localStorage.removeItem(INITIALIZE)
}

export const removeAll = (allowRetry) => {
    removeAutofill()
    removeTransactingElement()
    if(allowRetry) removeInitialize()
}