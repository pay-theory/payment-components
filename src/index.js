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
import 'regenerator-runtime'
import './style.css'

import createPaymentFieldsLegacy from './field-set/payment-fields'
import { SURCHARGE, SERVICE_FEE } from './common/data'
import ACH from './ACH/payment-fields'

const create = (apiKey, styles, tags, feeMode, host) => createPaymentFieldsLegacy(apiKey, '', styles, tags, feeMode, host)
const createPaymentFields = (apiKey, clientId, styles, tags, host) => createPaymentFieldsLegacy(apiKey, clientId, styles, tags, SERVICE_FEE, host)
const createAchFields = (apiKey, styles, tags, feeMode, host) => ACH(apiKey, '', styles, tags, feeMode, host)
window.paytheory = {
    createPaymentFields,
    create,
    createAchFields,
    SURCHARGE,
    SERVICE_FEE
}

export default window.paytheory
