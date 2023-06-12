import PayTheoryHostedField from '../pay-theory-hosted-field'
import {CASH_CONTACT} from "../../common/data";

class CashContactFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(['cash-contact'])
    this.setFieldName('cash-contact')
  }

}

window.customElements.define(CASH_CONTACT, CashContactFrame);
