import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'

class CashNameFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields([{ name: 'cash-name', label: 'Full Name', validations: null, autoComplete: 'name' }])
    this.setFieldName('cash-name')
  }

}

window.customElements.define('pay-theory-cash-name-tag-frame', CashNameFrame);
