import PayTheoryHostedField from '../pay-theory-hosted-field'

class ACHAccountNameFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'account-name', label: 'Name on Account' }])
    this.setFieldName('account-name')
  }

}

window.customElements.define('pay-theory-ach-account-name-tag-frame', ACHAccountNameFrame);
