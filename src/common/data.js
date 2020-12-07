/* global localStorage */
export const IDENTITY = 'pt-identity'
export const INSTRUMENT = 'pt-instrument'
export const BUYER = 'pt-buyer'
export const TOKEN = 'pt-token'
export const BIN = 'pt-bin'
export const READY = 'pt-ready'

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
    'number',
    'cvv',
    'exp',
    'account-name',
    'address-1',
    'address-2',
    'city',
    'state',
    'zip'
]

export const stateMap = {
    'credit-card': 'security_code|expiration_date|number',
    'number': 'number',
    'exp': 'expiration_date',
    'cvv': 'security_code',
    'account-name': 'name',
    'address-1': 'address.address_line1',
    'address-2': 'address.address_line2',
    'city': 'address.city',
    'state': 'address.region',
    'zip': 'address.postal_code'
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

export const getBuyer = () => {
    return JSON.parse(localStorage.getItem(BUYER))
}

export const setBuyer = buyer => {
    return localStorage.setItem(BUYER, JSON.stringify(buyer))
}

export const removeBuyer = () => {
    return localStorage.removeItem(BUYER)
}

export const getBin = () => {
    return JSON.parse(localStorage.getItem(BIN))
}

export const setBin = bin => {
    return localStorage.setItem(BIN, JSON.stringify(bin))
}

export const removeBin = () => {
    return localStorage.removeItem(BIN)
}

export const getToken = () => {
    return JSON.parse(localStorage.getItem(TOKEN))
}

export const setToken = token => {
    return localStorage.setItem(TOKEN, JSON.stringify(token))
}

export const removeToken = () => {
    return localStorage.removeItem(TOKEN)
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
