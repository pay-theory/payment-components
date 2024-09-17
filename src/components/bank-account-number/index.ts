import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional';
import { BANK_ACCOUNT_NUMBER, BANK_IFRAME, initialBankState } from '../../common/data';

class BankAccountNumberFrame extends PayTheoryHostedFieldTransactional {
  constructor() {
    super({
      transactingIFrameId: BANK_IFRAME,
      stateGroup: initialBankState,
      transactingType: 'bank',
    });
    this.setFields(['account-number']);
    this.setFieldName('account-number');
  }
}

window.customElements.define(BANK_ACCOUNT_NUMBER, BankAccountNumberFrame);
