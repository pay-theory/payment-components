import PayTheoryFinixTransactionalFrame from '../pay-theory-finix-transactional'
const NAME = 'credit-card-number'
const FIELDS = [
  { name: 'number', label: 'Card Number' }
]

class CreditCardNumberFrame extends PayTheoryFinixTransactionalFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}


if (!window.customElements.get('pay-theory-credit-card-number-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-number-tag-frame', CreditCardNumberFrame);
}
