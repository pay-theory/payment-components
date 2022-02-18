import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'cash-contact'
const FIELDS = [{ name: 'cash-contact', label: 'Phone or Email', validations: null, autoComplete: '' }];

class CashContactFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}

window.customElements.define('pay-theory-cash-contact-tag-frame', CashContactFrame);
