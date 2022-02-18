import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'account-type'
const FIELDS = [{ name: 'account-type', label: 'Account Type' }];

class ACHAccountTypeFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.setFieldName(NAME)
  }

}

window.customElements.define('pay-theory-ach-account-type-tag-frame', ACHAccountTypeFrame);
