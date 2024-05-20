import PayTheoryHostedField from '../pay-theory-hosted-field';
import { CARD_BILLING_LINE2 } from '../../common/data';

class CreditCardBillingAddress2Frame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['billing-line2']);
    this.setFieldName('billing-line2');
  }
}

window.customElements.define(CARD_BILLING_LINE2, CreditCardBillingAddress2Frame);
