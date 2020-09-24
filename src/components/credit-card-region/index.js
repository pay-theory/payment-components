import PayTheory from '../pay-theory-finix'
const NAME = 'region'
const FIELDS = [{ name: 'address.region', label: 'State' }];

class CreditCardBillingStateFrame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-state-tag-frame', CreditCardBillingStateFrame);
