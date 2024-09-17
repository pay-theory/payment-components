import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional';
import { CASH_IFRAME, CASH_NAME, cashFieldTypes, initialCashState } from '../../common/data';

class CashNameFrame extends PayTheoryHostedFieldTransactional {
  constructor() {
    const transactingFieldTypes = cashFieldTypes.transacting;
    const siblingFieldTypes = cashFieldTypes.siblings;
    super({
      fieldTypes: [...transactingFieldTypes, ...siblingFieldTypes],
      requiredValidFields: ['cash-name', 'cash-contact'],
      transactingIFrameId: CASH_IFRAME,
      stateGroup: initialCashState,
      transactingType: 'cash',
    });
    this.setFields(['cash-name']);
    this.setFieldName('cash-name');
  }
}

window.customElements.define(CASH_NAME, CashNameFrame);
