import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'exp'
const FIELDS = [{ name: 'card-exp', label: 'MM/YY', validations: 'required', autoComplete: 'cc-exp' }];

class CreditCardExpirationFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-exp-tag-frame', CreditCardExpirationFrame);
