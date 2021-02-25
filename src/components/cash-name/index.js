import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'
const NAME = 'cash-name'
const FIELDS = [{ name: 'cash-name', label: 'Full Name', validations: null, autoComplete: 'name' }];

class CashNameFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-cash-name-tag-frame', CashNameFrame);
