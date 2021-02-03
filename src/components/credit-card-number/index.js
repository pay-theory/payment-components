import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'
const NAME = 'number'
const FIELDS = [{ name: 'card-number', label: 'Card Number', validations: 'required', autoComplete: 'cc-number' }]

class CreditCardNumberFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}


if (!window.customElements.get('pay-theory-credit-card-number-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-number-tag-frame', CreditCardNumberFrame);
}
