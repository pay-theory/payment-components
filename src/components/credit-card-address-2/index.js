import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'billing-line2'
const FIELDS = [{ name: 'billing-line2', label: "Billing Address Cont'd", validations: null, autoComplete: 'address-line2' }];

class CreditCardBillingAddress2Frame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}

window.customElements.define('pay-theory-credit-card-billing-line2-tag-frame', CreditCardBillingAddress2Frame);
