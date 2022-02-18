import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'card-cvv'
const FIELDS = [{ name: 'card-cvv', label: 'CVV', validations: 'required', autoComplete: 'cc-csc' }];

class CreditCardCVVFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}

window.customElements.define('pay-theory-credit-card-card-cvv-tag-frame', CreditCardCVVFrame);
