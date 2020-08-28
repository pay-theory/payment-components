export const IDENTITY = 'pt-identity'

export defaultStyles = {
    default: {},
    success: {},
    error: {},
}

export defaultTags = {}

export const fields = {
    CREDIT_CARD_NAME: 'pay-theory-credit-card-account-name',
    CREDIT_CARD_CVV: 'pay-theory-credit-card-cvv',
    CREDIT_CARD_EXPIRATION: 'pay-theory-credit-card-expiration',
    CREDIT_CARD_NUMBER: 'pay-theory-credit-card-number',
    CREDIT_CARD_ZIP: 'pay-theory-credit-card-zip',
}

export const fieldTypes = ['cvv', 'account-name', 'expiration', 'number', 'zip']

export const stateMap = {
    'account-name': 'name',
    'cvv': 'security_code',
    'expiration': 'expiration_date',
    'zip': 'address.postal_code'
}
