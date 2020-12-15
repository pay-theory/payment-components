import PayTheoryFinixTransactionalFrame from '../pay-theory-finix-transactional'
const NAME = 'credit-card'
const FIELDS = [
  { name: 'number', label: 'Card Number', validations: 'required', autoComplete: 'cc-number' },
  { name: 'expiration_date', label: 'MM/YY', validations: 'required', autoComplete: 'cc-exp' },
  { name: 'security_code', label: 'CVC', validations: 'required', autoComplete: 'cc-csc' }
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
