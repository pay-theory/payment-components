import PayTheory from '../pay-theory-finix'
const NAME = 'zip'
const FIELDS = [{ name: 'address.postal_code', label: 'Billing Zip' }];

class CreditCardBillingZipFrame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-zip-tag-frame', CreditCardBillingZipFrame);
