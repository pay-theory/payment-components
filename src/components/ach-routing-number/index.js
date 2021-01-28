import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'routing-number'
const FIELDS = [{ name: 'routing-number', label: 'Routing Number' }];

class ACHRoutingNumberFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-ach-routing-number-tag-frame', ACHRoutingNumberFrame);
