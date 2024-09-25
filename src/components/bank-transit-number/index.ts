import PayTheoryHostedField from '../pay-theory-hosted-field';
import { BANK_TRANSIT_NUMBER } from '../../common/data';

class BankTransitNumberFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['transit-number']);
    this.setFieldName('transit-number');
  }
}

window.customElements.define(BANK_TRANSIT_NUMBER, BankTransitNumberFrame);
