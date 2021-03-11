import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'cash-zip'
const FIELDS = [{ name: 'cash-zip', label: 'Zip Code', validations: null, autoComplete: 'postal-code' }];

class CashZipFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-cash-zip-tag-frame', CashZipFrame);
