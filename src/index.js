import './components/credit-card'
import './components/credit-card-number'
import './components/credit-card-cvv'
import './components/credit-card-exp'
import './components/credit-card-account-name'
import './components/credit-card-address-1'
import './components/credit-card-address-2'
import './components/credit-card-city'
import './components/credit-card-region'
import './components/credit-card-zip'
import './components/ach-account-name'
import './components/ach-account-number'
import './components/ach-account-type'
import './components/ach-routing-number'
import 'regenerator-runtime'
import './style.css'

import createPaymentFieldsLegacy from './field-set/payment-fields'
import { SURCHARGE, SERVICE_FEE, fields, achFields } from './common/data'

const create = (apiKey, styles, tags, feeMode, env) => createPaymentFieldsLegacy(apiKey, '', styles, tags, feeMode, env)
const createPaymentFields = (apiKey, clientId, styles, tags, env) => {
    console.warn('createPaymentFields has been deprecated')
    return createPaymentFieldsLegacy(apiKey, clientId, styles, tags, SERVICE_FEE, env)
}
const ELEMENTS = {
    'credit-card': fields.CREDIT_CARD,
    'number': fields.CREDIT_CARD_NUMBER,
    'exp': fields.CREDIT_CARD_EXP,
    'cvv': fields.CREDIT_CARD_CVV,
    'account-name': fields.CREDIT_CARD_NAME,
    'address-1': fields.CREDIT_CARD_ADDRESS1,
    'address-2': fields.CREDIT_CARD_ADDRESS2,
    city: fields.CREDIT_CARD_CITY,
    state: fields.CREDIT_CARD_STATE,
    zip: fields.CREDIT_CARD_ZIP,
    'account-number': achFields.ACCOUNT_NUMBER,
    'ach-name': achFields.ACCOUNT_NAME,
    'routing-number': achFields.BANK_CODE,
    'account-type': achFields.ACCOUNT_TYPE,
}
window.paytheory = {
    createPaymentFields,
    create,
    SURCHARGE,
    SERVICE_FEE
}

export default window.paytheory
