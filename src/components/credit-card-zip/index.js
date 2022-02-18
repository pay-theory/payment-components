import PayTheoryHostedField from '../pay-theory-hosted-field'

class CreditCardBillingZipFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'billing-zip', label: 'Billing Zip', validations: null, autoComplete: 'postal-code' }])
    this.setFieldName('billing-zip')
  }

}

window.customElements.define('pay-theory-credit-card-billing-zip-tag-frame', CreditCardBillingZipFrame);
