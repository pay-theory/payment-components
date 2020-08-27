import PayTheoryFinixFrame from '../pay-theory-finix'
const NAME = 'credit-card'
const FIELDS = [
  { name: 'number', label: 'Card Number' },
  { name: 'expiration_date', label: 'MM/YY' },
  { name: 'security_code', label: 'CVC' },
  { name: 'address.postal_code', label: 'Zip' }
]

const FINIX_ENV = process.env.BUILD_ENV === 'prod' ? 'live' : 'sandbox'

/* global HTMLElement */
class CreditCardFrame extends PayTheoryFinixFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

  defineFields(form, styles) {
    super.defineFields(form, styles)
    const badgeElement = document.createElement('span')
    badgeElement.setAttribute('id', 'pay-theory-badge-wrapper')
    this.appendElement(badgeElement)
  }

  get transact() {
    return this.transacting;
  }

  set transact(_transacting) {
    if (this.transacting !== _transacting) {
      this.transacting = _transacting;
      this.form.submit(FINIX_ENV, this.application, (err, res) => {
        console.log('submission result', err, res)
        if (err) {
          this.error = err;
        }
        else {
          const tokenized = { bin: this.bin, ...res };
          window.postMessage({
              type: 'tokenized',
              tokenized,
            },
            window.location.origin,
          );
        }
      });
    }
  }
}


if (!window.customElements.get('pay-theory-credit-card-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-tag-frame', CreditCardFrame);
}
