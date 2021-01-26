import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'
const NAME = 'account-number'
const FIELDS = [{ name: 'account-number', label: 'Account Number' }];

class ACHAccountNumberFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-ach-account-number-tag-frame', ACHAccountNumberFrame);
