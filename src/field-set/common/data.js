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
    CREDIT_CARD_NAME: 'pay-theory-credit-card-account-name',
    CREDIT_CARD: 'pay-theory-credit-card',
    CREDIT_CARD_ZIP: 'pay-theory-credit-card-zip',
}

export const fieldTypes = ['account-name', 'credit-card', 'zip']

export const stateMap = {
    'account-name': 'name',
    'credit-card': 'security_code|expiration_date|number',
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
