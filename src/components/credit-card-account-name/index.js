import PayTheoryFinixFrame from '../pay-theory-finix'
const NAME = 'name'
const FIELDS = [{ name: 'name', label: 'Name on card' }];

/* global HTMLElement */
class CreditCardNameFrame extends PayTheoryFinixFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

if (!window.customElements.get('paytheory-credit-card-account-name-tag-frame')) {
  window.customElements.define('paytheory-credit-card-account-name-tag-frame', CreditCardNameFrame);
}
