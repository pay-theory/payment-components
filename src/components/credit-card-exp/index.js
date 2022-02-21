import PayTheoryHostedField from '../pay-theory-hosted-field'

class CreditCardExpirationFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'card-exp', label: 'MM/YY', validations: 'required', autoComplete: 'cc-exp' }])
    this.setFieldName('card-exp')
  }

}

window.customElements.define('pay-theory-credit-card-card-exp-tag-frame', CreditCardExpirationFrame);
