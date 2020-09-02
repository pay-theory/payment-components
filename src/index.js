import './components/credit-card'
import './components/credit-card-account-name'
import './components/credit-card-zip'
import 'regenerator-runtime'
import './style.css'

import createPaymentFields from './field-set/payment-fields'
import createCreditCardFields from './field-set/split'
import createCreditCard from './field-set/combined'

window.paytheory = {
  createPaymentFields,
  createCreditCardFields,
  createCreditCard
}

export default window.paytheory
