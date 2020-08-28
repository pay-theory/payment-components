import PayTheoryFinixFrame from '../pay-theory-finix'
const NAME = 'expiration'
const FIELDS = [{ name: 'expiration_date', label: 'MM/YY' }];

/* global HTMLElement */
class CreditCardExpirationFrame extends PayTheoryFinixFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

if (!window.customElements.get('pay-theory-credit-card-expiration-tag-frame')) {
  window.customElements.define(
    'pay-theory-credit-card-expiration-tag-frame',
    CreditCardExpirationFrame,
  )
}
