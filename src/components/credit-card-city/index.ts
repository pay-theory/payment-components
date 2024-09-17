import PayTheoryHostedField from '../pay-theory-hosted-field';
import { CARD_BILLING_CITY } from '../../common/data';

class CreditCardBillingCityFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['billing-city']);
    this.setFieldName('billing-city');
  }
}

window.customElements.define(CARD_BILLING_CITY, CreditCardBillingCityFrame);
