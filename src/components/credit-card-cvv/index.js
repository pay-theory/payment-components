import PayTheoryHostedField from '../pay-theory-hosted-field'

class CreditCardCVVFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'card-cvv', label: 'CVV', validations: 'required', autoComplete: 'cc-csc' }])
    this.setFieldName('card-cvv')
  }

}

window.customElements.define('pay-theory-credit-card-card-cvv-tag-frame', CreditCardCVVFrame);
