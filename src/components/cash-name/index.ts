import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional';
import { CASH_IFRAME, CASH_NAME, initialCashState } from '../../common/data';

class CashNameFrame extends PayTheoryHostedFieldTransactional {
  constructor() {
    super({
      transactingIFrameId: CASH_IFRAME,
      stateGroup: initialCashState,
      transactingType: 'cash',
    });
    this.setFields(['cash-name']);
    this.setFieldName('cash-name');
  }
}

window.customElements.define(CASH_NAME, CashNameFrame);
