import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'
const NAME = 'credit-card'
const FIELDS = [
  { name: 'card-number', label: 'Card Number', validations: 'required', autoComplete: 'cc-number' },
  { name: 'card-exp', label: 'MM/YY', validations: 'required', autoComplete: 'cc-exp' },
  { name: 'card-cvv', label: 'CVC', validations: 'required', autoComplete: 'cc-csc' }
]

class CreditCardFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}


if (!window.customElements.get('pay-theory-credit-card-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-tag-frame', CreditCardFrame);
}
