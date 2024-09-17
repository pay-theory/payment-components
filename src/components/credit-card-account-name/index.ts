import PayTheoryHostedField from '../pay-theory-hosted-field';
import { CARD_NAME } from '../../common/data';

class CreditCardNameFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['card-name']);
    this.setFieldName('card-name');
  }
}

window.customElements.define(CARD_NAME, CreditCardNameFrame);
