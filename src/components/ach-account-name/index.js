import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'account-name'
const FIELDS = [{ name: 'account-name', label: 'Name on Account' }];

class CreditCardNameFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-ach-account-name-tag-frame', CreditCardNameFrame);
