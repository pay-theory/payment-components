import PayTheoryHostedField from '../pay-theory-hosted-field'

class CreditCardBillingAddress2Frame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'billing-line2', label: "Billing Address Cont'd", validations: null, autoComplete: 'address-line2' }])
    this.setFieldName('billing-line2')
  }

}

window.customElements.define('pay-theory-credit-card-billing-line2-tag-frame', CreditCardBillingAddress2Frame);
