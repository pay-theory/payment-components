import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional';
import { CARD_IFRAME, cardFieldTypes, COMBINED_CARD, initialCardState } from '../../common/data';

class CreditCardFrame extends PayTheoryHostedFieldTransactional {
  constructor() {
    const transactingFieldTypes = cardFieldTypes.transacting;
    const siblingFieldTypes = cardFieldTypes.siblings;
    super({
      fieldTypes: [...transactingFieldTypes, ...siblingFieldTypes],
      requiredValidFields: ['card-number', 'card-cvv', 'card-exp', 'billing-zip'],
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
