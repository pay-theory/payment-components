import PayTheoryHostedField from '../pay-theory-hosted-field'

class CreditCardBillingCityFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'billing-city', label: 'Billing City', validations: null, autoComplete: 'locality' }])
    this.setFieldName('billing-city')
  }

}

window.customElements.define('pay-theory-credit-card-billing-city-tag-frame', CreditCardBillingCityFrame);
