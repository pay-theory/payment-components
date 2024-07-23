import PayTheoryHostedField from '../pay-theory-hosted-field';
import { BANK_ACCOUNT_NAME } from '../../common/data';

class BankAccountNameFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['account-name']);
    this.setFieldName('account-name');
  }
}

window.customElements.define(BANK_ACCOUNT_NAME, BankAccountNameFrame);
