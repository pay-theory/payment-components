import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'
import {ACH_ACCOUNT_NUMBER} from "../../common/data";
class ACHAccountNumberFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields(['account-number'])
    this.setFieldName('account-number')
  }

}

window.customElements.define(ACH_ACCOUNT_NUMBER, ACHAccountNumberFrame);
