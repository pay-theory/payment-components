import PayTheoryHostedField from '../pay-theory-hosted-field'
import {CARD_CVV} from "../../common/data";

class CreditCardCVVFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(['card-cvv'])
    this.setFieldName('card-cvv')
  }

}

window.customElements.define(CARD_CVV, CreditCardCVVFrame);
