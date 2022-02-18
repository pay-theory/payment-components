import PayTheoryHostedField from '../pay-theory-hosted-field'

class CreditCardBillingAddress1Frame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'billing-line1', label: 'Billing Address', validations: null, autoComplete: 'address-line1' }])
    this.setFieldName('billing-line1')
  }

}

window.customElements.define('pay-theory-credit-card-billing-line1-tag-frame', CreditCardBillingAddress1Frame);
