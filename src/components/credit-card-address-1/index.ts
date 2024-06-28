import PayTheoryHostedField from '../pay-theory-hosted-field';
import { CARD_BILLING_LINE1 } from '../../common/data';

class CreditCardBillingAddress1Frame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['billing-line1']);
    this.setFieldName('billing-line1');
  }
}

window.customElements.define(CARD_BILLING_LINE1, CreditCardBillingAddress1Frame);
