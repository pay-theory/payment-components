import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'account-number'
const FIELDS = [{ name: 'account-number', label: 'Account Number' }];

class CreditCardNameFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-ach-account-number-tag-frame', CreditCardNameFrame);
