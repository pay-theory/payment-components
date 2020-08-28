import PayTheoryFinixFrame from '../pay-theory-finix'
const NAME = 'expiration'
const FIELDS = [{ name: 'expiration_date', label: 'MM/YY' }];

class CreditCardExpirationFrame extends PayTheoryFinixFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define(
  'pay-theory-credit-card-expiration-tag-frame',
  CreditCardExpirationFrame,
)
