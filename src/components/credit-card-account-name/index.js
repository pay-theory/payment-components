import PayTheoryFinixFrame from '../pay-theory-finix'
const NAME = 'account-name'
const FIELDS = [{ name: 'name', label: 'Name on card' }];

class CreditCardNameFrame extends PayTheoryFinixFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-account-name-tag-frame', CreditCardNameFrame);
