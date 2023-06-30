import PayTheoryHostedField from '../pay-theory-hosted-field'
import {CARD_BILLING_STATE} from "../../common/data";

class CreditCardBillingStateFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(['billing-state'])
    this.setFieldName('billing-state')
  }

}

window.customElements.define(CARD_BILLING_STATE, CreditCardBillingStateFrame);
