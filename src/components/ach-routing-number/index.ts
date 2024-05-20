import PayTheoryHostedField from '../pay-theory-hosted-field';
import { ACH_ROUTING_NUMBER } from '../../common/data';

class ACHRoutingNumberFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['routing-number']);
    this.setFieldName('routing-number');
  }
}

window.customElements.define(ACH_ROUTING_NUMBER, ACHRoutingNumberFrame);
