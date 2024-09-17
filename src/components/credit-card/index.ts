import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional';
import { CARD_IFRAME, COMBINED_CARD, initialCardState } from '../../common/data';

class CreditCardFrame extends PayTheoryHostedFieldTransactional {
  constructor() {
    super({
      transactingIFrameId: CARD_IFRAME,
      stateGroup: initialCardState,
      transactingType: 'card',
    });
    this.setFields(['card-number', 'card-exp', 'card-cvv']);
    this.setFieldName('credit-card');
  }
}

if (!window.customElements.get(COMBINED_CARD)) {
  window.customElements.define(COMBINED_CARD, CreditCardFrame);
}
