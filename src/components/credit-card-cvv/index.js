import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'cvv'
const FIELDS = [{ name: 'card-cvv', label: 'CVV', validations: 'required', autoComplete: 'cc-csc' }];

class CreditCardCVVFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-cvv-tag-frame', CreditCardCVVFrame);
