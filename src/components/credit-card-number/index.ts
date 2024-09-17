import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional';
import { CARD_IFRAME, CARD_NUMBER, cardFieldTypes, initialCardState } from '../../common/data';

class CreditCardNumberFrame extends PayTheoryHostedFieldTransactional {
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
    this.setFields(['card-number']);
    this.setFieldName('card-number');
  }
}

if (!window.customElements.get(CARD_NUMBER)) {
  window.customElements.define(CARD_NUMBER, CreditCardNumberFrame);
}
