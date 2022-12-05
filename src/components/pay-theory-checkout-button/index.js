import PayTheoryHostedField from '../pay-theory-hosted-field'

class PayTheoryCheckoutButton extends PayTheoryHostedField {
    constructor() {
        super()
        this.setFields([{ name: 'checkout-button', label: 'Checkout Button', validations: null, autoComplete: 'locality' }])
        this.setFieldName('checkout-button')
    }

}

window.customElements.define('pay-theory-checkout-button-tag-frame', PayTheoryCheckoutButton);
