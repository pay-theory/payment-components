import PayTheoryHostedField from '../pay-theory-hosted-field';

class CardPresentFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields([{ name: 'card-present', label: 'Card Present' }]);
    this.setFieldName('card-present');
  }
}

window.customElements.define('pay-theory-card-present-tag-frame', CardPresentFrame);
