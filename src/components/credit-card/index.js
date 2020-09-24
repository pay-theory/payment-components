import PayTheoryFinixTransactionalFrame from '../pay-theory-finix-transactional'
const NAME = 'credit-card'
const FIELDS = [
  { name: 'number', label: 'Card Number' },
  { name: 'expiration_date', label: 'MM/YY' },
  { name: 'security_code', label: 'CVC' }
]

class CreditCardFrame extends PayTheoryFinixTransactionalFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}


if (!window.customElements.get('pay-theory-credit-card-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-tag-frame', CreditCardFrame);
}
