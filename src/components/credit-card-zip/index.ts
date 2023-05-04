import PayTheoryHostedField from '../pay-theory-hosted-field'
import {CARD_BILLING_ZIP} from "../../common/data";

class CreditCardBillingZipFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(['billing-zip'])
    this.setFieldName('billing-zip')
  }

}

window.customElements.define(CARD_BILLING_ZIP, CreditCardBillingZipFrame);
