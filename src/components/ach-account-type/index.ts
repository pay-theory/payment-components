import PayTheoryHostedField from '../pay-theory-hosted-field';
import { ACH_ACCOUNT_TYPE } from '../../common/data';

class ACHAccountTypeFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['account-type']);
    this.setFieldName('account-type');
  }
}

window.customElements.define(ACH_ACCOUNT_TYPE, ACHAccountTypeFrame);
