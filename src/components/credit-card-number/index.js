import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'

class CreditCardNumberFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields([{ name: 'card-number', label: 'Card Number', validations: 'required', autoComplete: 'cc-number' }])
    this.setFieldName('card-number')
  }

}


if (!window.customElements.get('pay-theory-credit-card-card-number-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-card-number-tag-frame', CreditCardNumberFrame);
}
