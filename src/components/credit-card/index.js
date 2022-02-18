import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'

class CreditCardFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields([
      { name: 'card-number', label: 'Card Number', validations: 'required', autoComplete: 'cc-number' },
      { name: 'card-exp', label: 'MM/YY', validations: 'required', autoComplete: 'cc-exp' },
      { name: 'card-cvv', label: 'CVC', validations: 'required', autoComplete: 'cc-csc' }
    ])
    this.setFieldName('credit-card')
  }

}


if (!window.customElements.get('pay-theory-credit-card-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-tag-frame', CreditCardFrame);
}
