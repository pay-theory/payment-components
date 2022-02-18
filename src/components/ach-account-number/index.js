import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'
class ACHAccountNumberFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields([{ name: 'account-number', label: 'Account Number' }])
    this.setFieldName('account-number')
  }

}

window.customElements.define('pay-theory-ach-account-number-tag-frame', ACHAccountNumberFrame);
