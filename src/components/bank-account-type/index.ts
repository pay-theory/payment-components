import PayTheoryHostedField from '../pay-theory-hosted-field';
import { BANK_ACCOUNT_TYPE } from '../../common/data';

class BankAccountTypeFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['account-type']);
    this.setFieldName('account-type');
  }
}

window.customElements.define(BANK_ACCOUNT_TYPE, BankAccountTypeFrame);
