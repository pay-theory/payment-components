import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'card-exp'
const FIELDS = [{ name: 'card-exp', label: 'MM/YY', validations: 'required', autoComplete: 'cc-exp' }];

class CreditCardExpirationFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}

window.customElements.define('pay-theory-credit-card-card-exp-tag-frame', CreditCardExpirationFrame);
