import PayTheoryHostedField from '../pay-theory-hosted-field';
import { BANK_ROUTING_NUMBER } from '../../common/data';

class BankRoutingNumberFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['routing-number']);
    this.setFieldName('routing-number');
  }
}

window.customElements.define(BANK_ROUTING_NUMBER, BankRoutingNumberFrame);
