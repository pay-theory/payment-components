import PayTheoryFinixFrame from '../pay-theory-finix'
const NAME = 'cvv'
const FIELDS = [{ name: 'security_code', label: 'CVC' }];

/* global HTMLElement */
class CreditCardSecurityFrame extends PayTheoryFinixFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

if (!window.customElements.get('paytheory-credit-card-cvv-tag-frame')) {
  window.customElements.define('paytheory-credit-card-cvv-tag-frame', CreditCardSecurityFrame);
}
