import PayTheory from '../pay-theory-finix'
const NAME = 'cvv'
const FIELDS = [{ name: 'security_code', label: 'CVC' }];

class CreditCardSecurityFrame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-cvv-tag-frame', CreditCardSecurityFrame);
