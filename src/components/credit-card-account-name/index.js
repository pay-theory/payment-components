import PayTheoryHostedField from '../pay-theory-hosted-field'

class CreditCardNameFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'card-name', label: 'Name on card', validations: null, autoComplete: 'cc-name' }])
    this.setFieldName('card-name')
  }

}

window.customElements.define('pay-theory-credit-card-card-name-tag-frame', CreditCardNameFrame);
