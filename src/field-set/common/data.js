/* global localStorage */
export const IDENTITY = 'pt-identity'
export const INSTRUMENT = 'pt-instrument'

export const defaultStyles = {
    default: {},
    success: {},
    error: {},
}

export const defaultTags = {}

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

export const fieldTypes = [
    'credit-card',
    'credit-card-number',
    'credit-card-cvv',
    'credit-card-exp',
    'account-name',
    'address-1',
    'address-2',
    'city',
    'state',
    'zip'
]

export const stateMap = {
    'credit-card': 'security_code|expiration_date|number',
    'credit-card-number': 'number',
    'credit-card-exp': 'expiration_date',
    'credit-card-cvv': 'security_code',
    'account-name': 'name',
    'zip': 'address.address_line1',
    'zip': 'address.address_line2',
    'zip': 'address.city',
    'zip': 'address.region',
    'zip': 'address.postal_code'
}

export const getIdentity = () => {
    return JSON.parse(localStorage.getItem(IDENTITY))
}

export const setIdentity = identity => {
    return localStorage.setItem(IDENTITY, JSON.stringify(identity))
}

export const removeIdentity = () => {
    return localStorage.removeItem(IDENTITY)
}

export const getInstrument = () => {
    return JSON.parse(localStorage.getItem(INSTRUMENT))
}

export const setInstrument = instrument => {
    return localStorage.setItem(INSTRUMENT, JSON.stringify(instrument))
}

export const removeInstrument = () => {
    return localStorage.removeItem(INSTRUMENT)
}
