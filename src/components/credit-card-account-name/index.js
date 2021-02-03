import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'account-name'
const FIELDS = [{ name: 'card-name', label: 'Name on card', validations: null, autoComplete: 'cc-name' }];

class CreditCardNameFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-account-name-tag-frame', CreditCardNameFrame);
