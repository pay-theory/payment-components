import PayTheoryHostedField from '../pay-theory-hosted-field'

class ACHAccountTypeFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'account-type', label: 'Account Type' }])
    this.setFieldName('account-type')
  }

}

window.customElements.define('pay-theory-ach-account-type-tag-frame', ACHAccountTypeFrame);
