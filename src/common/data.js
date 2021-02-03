/* global localStorage */
export const MERCHANT = 'pt-merchant'
export const IDENTITY = 'pt-identity'
export const INSTRUMENT = 'pt-instrument'
export const BUYER = 'pt-buyer'
export const TOKEN = 'pt-token'
export const BIN = 'pt-bin'
export const READY = 'pt-ready'
export const TRANSACTING = 'pt-transacting'
export const IDEMPOTENCY = 'pt-idempotency'

export const defaultStyles = {
    default: {},
    success: {},
    error: {},
}
export const SURCHARGE = 'surcharge'
export const SERVICE_FEE = 'service_fee'

export const defaultFeeMode = SURCHARGE

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

export const achFields = {
    ACCOUNT_NUMBER: 'pay-theory-ach-account-number',
    ACCOUNT_TYPE: 'pay-theory-ach-account-type',
    ACCOUNT_NAME: 'pay-theory-ach-account-name',
    BANK_CODE: 'pay-theory-ach-routing-number'
}

export const achFieldTypes = [
    'account-name',
    'account-type',
    'account-number',
    'routing-number'
]

export const fieldTypes = [
    'credit-card',
    'number',
    'cvv',
    'exp',
    'name',
    'address-1',
    'address-2',
    'city',
    'state',
    'zip'
]

export const findEnv = () => {
    switch (process.env.BUILD_ENV) {
    case 'prod':
        return 'prod'
    case 'stage':
        return 'demo'
    default:
        return 'dev'
    }
}

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

export const getTransactingElement = () => {
    return localStorage.getItem(TRANSACTING)
}

export const setTransactingElement = element => {
    return localStorage.setItem(TRANSACTING, element.id)
}

export const removeTransactingElement = () => {
    return localStorage.removeItem(TRANSACTING)
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

export const getIdempotency = () => {
    return JSON.parse(localStorage.getItem(IDEMPOTENCY))
}

export const setIdempotency = token => {
    return localStorage.setItem(IDEMPOTENCY, JSON.stringify(token))
}

export const removeIdempotency = () => {
    return localStorage.removeItem(IDEMPOTENCY)
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

export const getMerchant = () => {
    return JSON.parse(localStorage.getItem(MERCHANT))
}

export const setMerchant = merchant => {
    return localStorage.setItem(MERCHANT, JSON.stringify(merchant))
}

export const removeMerchant = () => {
    return localStorage.removeItem(MERCHANT)
}

export const removeAll = () => {
    removeMerchant()
    removeIdentity()
    removeToken()
    removeBuyer()
    removeBin()
    removeTransactingElement()
    removeIdempotency()
}
