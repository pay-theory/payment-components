import PayTheory from '../pay-theory-finix'
const NAME = 'cvv'
const FIELDS = [{ name: 'security_code', label: 'CVC' }];

/* global HTMLElement */
class CreditCardSecurityFrame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

if (!window.customElements.get('pay-theory-credit-card-cvv-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-cvv-tag-frame', CreditCardSecurityFrame);
}
