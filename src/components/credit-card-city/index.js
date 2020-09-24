import PayTheory from '../pay-theory-finix'
const NAME = 'city'
const FIELDS = [{ name: 'address.city', label: 'Billing City' }];

class CreditCardBillingCityFrame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-city-tag-frame', CreditCardBillingCityFrame);
