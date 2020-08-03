import PayTheoryFinixFrame from '../pay-theory-finix'
const NAME = 'zip'
const FIELDS = [{ name: 'address.postal_code', label: 'Zip' }];

/* global HTMLElement */
class CreditCardBillingZipFrame extends PayTheoryFinixFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

if (!window.customElements.get('paytheory-credit-card-zip-tag-frame')) {
  window.customElements.define('paytheory-credit-card-zip-tag-frame', CreditCardBillingZipFrame);
}
