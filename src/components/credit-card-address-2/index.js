import PayTheory from '../pay-theory-finix'
const NAME = 'address-2'
const FIELDS = [{ name: 'address.address_line2', label: "Billing Address Cont'd" }];

class CreditCardBillingAddress2Frame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-address-2-tag-frame', CreditCardBillingAddress2Frame);
