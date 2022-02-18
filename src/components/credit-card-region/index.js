import PayTheoryHostedField from '../pay-theory-hosted-field'

class CreditCardBillingStateFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'billing-state', label: 'Billing State', validations: null, autoComplete: 'region' }])
    this.setFieldName('billing-state')
  }

}

window.customElements.define('pay-theory-credit-card-billing-state-tag-frame', CreditCardBillingStateFrame);
