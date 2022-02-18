import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'billing-city'
const FIELDS = [{ name: 'billing-city', label: 'Billing City', validations: null, autoComplete: 'locality' }];

class CreditCardBillingCityFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}

window.customElements.define('pay-theory-credit-card-billing-city-tag-frame', CreditCardBillingCityFrame);
