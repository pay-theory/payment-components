import PayTheory from '../pay-theory-finix'
const NAME = 'number'
const FIELDS = [{ name: 'number', label: 'Card Number' }];

/* global HTMLElement */
class CreditCardNumberFrame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

  get transact() {
    return this.transacting
  }

  set transact(_transacting) {
    if (this.transacting !== _transacting) {
      this.transacting = _transacting
      this.form.submit('sandbox', this.application, (err, res) => {
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

if (!window.customElements.get('pay-theory-credit-card-number-tag-frame')) {
  window.customElements.define('pay-theory-credit-card-number-tag-frame', CreditCardNumberFrame);
}
