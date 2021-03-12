/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
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
import './components/cash-contact'
import './components/cash-name'
import './components/cash-zip'
import 'regenerator-runtime'
import './style.css'

import createPaymentFieldsLegacy from './field-set/payment-fields'
import { SURCHARGE, SERVICE_FEE } from './common/data'

const create = (apiKey, styles, tags, feeMode, env) => createPaymentFieldsLegacy(apiKey, '', styles, tags, feeMode, env)
const createPaymentFields = (apiKey, clientId, styles, tags, env) => {
    console.warn('createPaymentFields has been deprecated')
    return createPaymentFieldsLegacy(apiKey, clientId, styles, tags, SERVICE_FEE, env)
}

window.paytheory = {
    createPaymentFields,
    create,
    SURCHARGE,
    SERVICE_FEE
}

export default window.paytheory
