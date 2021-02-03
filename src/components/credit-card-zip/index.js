import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'zip'
const FIELDS = [{ name: 'billing-zip', label: 'Billing Zip', validations: null, autoComplete: 'postal-code' }];

class CreditCardBillingZipFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-zip-tag-frame', CreditCardBillingZipFrame);
