import PayTheory from '../pay-theory-finix'
const NAME = 'number'
const FIELDS = [{ name: 'number', label: 'Card Number' }];
const FINIX_ENV = process.env.BUILD_ENV === 'prod' ? 'live' : 'sandbox'

class CreditCardNumberFrame extends PayTheory {

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
    return this.transacting
  }

  set transact(_transacting) {
    if (this.transacting !== _transacting) {
      this.transacting = _transacting

      this.form.submit(FINIX_ENV, this.application, (err, res) => {
        if (err) {
          this.error = err
        }
        else {
          const tokenized = { bin: this.bin, ...res }
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

window.customElements.define('pay-theory-credit-card-number-tag-frame', CreditCardNumberFrame);
