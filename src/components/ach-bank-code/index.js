import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'bank-code'
const FIELDS = [{ name: 'bank-code', label: 'Bank Code' }];

class CreditCardNameFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-ach-bank-code-tag-frame', CreditCardNameFrame);
