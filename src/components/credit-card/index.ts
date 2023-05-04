import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'
import {COMBINED_CARD} from '../../common/data';

class CreditCardFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    super()
    this.setFields(['card-number', 'card-exp', 'card-cvv'])
    this.setFieldName('credit-card')
  }

}


if (!window.customElements.get(COMBINED_CARD)) {
  window.customElements.define(COMBINED_CARD, CreditCardFrame);
}
