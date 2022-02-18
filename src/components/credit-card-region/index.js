import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'billing-state'
const FIELDS = [{ name: 'billing-state', label: 'Billing State', validations: null, autoComplete: 'region' }];

class CreditCardBillingStateFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}

window.customElements.define('pay-theory-credit-card-billing-state-tag-frame', CreditCardBillingStateFrame);
