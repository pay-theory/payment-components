import PayTheoryHostedField from '../pay-theory-hosted-field';
import { CARD_EXP } from '../../common/data';

class CreditCardExpirationFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['card-exp']);
    this.setFieldName('card-exp');
  }
}

window.customElements.define(CARD_EXP, CreditCardExpirationFrame);
