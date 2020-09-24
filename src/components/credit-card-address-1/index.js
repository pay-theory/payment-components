import PayTheory from '../pay-theory-finix'
const NAME = 'address-1'
const FIELDS = [{ name: 'address.address_line1', label: 'Billing Address' }];

class CreditCardBillingAddress1Frame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-address-1-tag-frame', CreditCardBillingAddress1Frame);
