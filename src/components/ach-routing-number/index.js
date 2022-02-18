import PayTheoryHostedField from '../pay-theory-hosted-field'

class ACHRoutingNumberFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields([{ name: 'routing-number', label: 'Routing Number' }])
    this.setFieldName('routing-number')
  }

}

window.customElements.define('pay-theory-ach-routing-number-tag-frame', ACHRoutingNumberFrame);
