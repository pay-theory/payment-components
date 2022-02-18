import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'billing-zip'
const FIELDS = [{ name: 'billing-zip', label: 'Billing Zip', validations: null, autoComplete: 'postal-code' }];

class CreditCardBillingZipFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}

window.customElements.define('pay-theory-credit-card-billing-zip-tag-frame', CreditCardBillingZipFrame);
