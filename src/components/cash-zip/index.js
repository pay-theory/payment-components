import PayTheoryHostedField from '../pay-theory-hosted-field'

class CashZipFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'cash-zip', label: 'Zip Code', validations: null, autoComplete: 'postal-code' }])
    this.setFieldName('cash-zip')
  }

}

window.customElements.define('pay-theory-cash-zip-tag-frame', CashZipFrame);
