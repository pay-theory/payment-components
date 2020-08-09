import './components/credit-card'
import './components/credit-card-account-name'
import './components/credit-card-cvv'
import './components/credit-card-expiration'
import './components/credit-card-number'
import './components/credit-card-zip'
import 'regenerator-runtime'
import './style.css'

import createCreditCard from './field-set/combined'
import createCreditCardFields from './field-set/split'

window.paytheory = {
  createCreditCard,
  createCreditCardFields,
}

export default window.paytheory
