import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'state'
const FIELDS = [{ name: 'billing-state', label: 'Billing State', validations: null, autoComplete: 'region' }];

class CreditCardBillingStateFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-state-tag-frame', CreditCardBillingStateFrame);
