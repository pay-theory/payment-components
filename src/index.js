import './components/credit-card'
import './components/credit-card-account-name'
import './components/credit-card-zip'
import 'regenerator-runtime'
import './style.css'

import createPaymentFields from './field-set/payment-fields'

window.paytheory = {
    createPaymentFields
}

export default window.paytheory
