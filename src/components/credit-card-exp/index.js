import PayTheory from '../pay-theory-finix'
const NAME = 'expiration_date'
const FIELDS = [{ name: 'expiration_date', label: 'MM/YY' }];

class CreditCardExpirationFrame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-exp-tag-frame', CreditCardExpirationFrame);
