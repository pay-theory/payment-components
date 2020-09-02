import PayTheoryFinixFrame from '../pay-theory-finix'
const NAME = 'credit-card'
const FIELDS = [
  { name: 'number', label: 'Card Number' },
  { name: 'expiration_date', label: 'MM/YY' },
  { name: 'security_code', label: 'CVC' }
]

const FINIX_ENV = process.env.BUILD_ENV === 'prod' ? 'live' : 'sandbox'


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
    const provided_amount = Number.isInteger(parseInt(this.amount))
    if (this.transacting !== _transacting) {
      this.transacting = _transacting;
      this.form.submit(FINIX_ENV, this.application, (err, res) => {
        if (err) {
          this.error = err;
        }
        else {
          const tokenized = { bin: this.bin, ...res };
          window.postMessage({
              type: 'tokenized',
              tokenized,
              provided_amount
            },
            window.location.origin,
          );
        }
      });
    }
  }

  get amount() {
    return this.amounting;
  }

  set amount(_amounting) {
    if (this.amounting !== _amounting) {
      this.amounting = _amounting;
    }
  }
}


if (!window.customElements.get('pay-theory-credit-card-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-tag-frame', CreditCardFrame);
}
