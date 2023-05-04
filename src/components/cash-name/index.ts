import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'
import {CASH_NAME} from "../../common/data";

class CashNameFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields(['cash-name'])
    this.setFieldName('cash-name')
  }

}

window.customElements.define(CASH_NAME, CashNameFrame);
