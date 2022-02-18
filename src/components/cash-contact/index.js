import PayTheoryHostedField from '../pay-theory-hosted-field'

class CashContactFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'cash-contact', label: 'Phone or Email', validations: null, autoComplete: '' }])
    this.setFieldName('cash-contact')
  }

}

window.customElements.define('pay-theory-cash-contact-tag-frame', CashContactFrame);
