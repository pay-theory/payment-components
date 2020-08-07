import PayTheory from '../pay-theory-finix'
const NAME = 'zip'
const FIELDS = [{ name: 'address.postal_code', label: 'Zip' }];

/* global HTMLElement */
class CreditCardBillingZipFrame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

if (!window.customElements.get('pay-theory-credit-card-zip-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-zip-tag-frame', CreditCardBillingZipFrame);
}
