import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'address-1'
const FIELDS = [{ name: 'billing-line1', label: 'Billing Address', validations: null, autoComplete: 'address-line1' }];

class CreditCardBillingAddress1Frame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-address-1-tag-frame', CreditCardBillingAddress1Frame);
