import PayTheoryHostedField from '../pay-theory-hosted-field'
import {ACH_ACCOUNT_NAME} from "../../common/data";

class ACHAccountNameFrame extends PayTheoryHostedField {
  constructor() {
    super()
    this.setFields(['account-name'])
    this.setFieldName('account-name')
  }

}

window.customElements.define(ACH_ACCOUNT_NAME, ACHAccountNameFrame);
