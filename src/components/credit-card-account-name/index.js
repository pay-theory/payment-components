import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'card-name'
const FIELDS = [{ name: 'card-name', label: 'Name on card', validations: null, autoComplete: 'cc-name' }];

class CreditCardNameFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}

window.customElements.define('pay-theory-credit-card-card-name-tag-frame', CreditCardNameFrame);
