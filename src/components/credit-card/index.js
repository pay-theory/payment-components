import PayTheoryFinixFrame from '../pay-theory-finix'
const NAME = 'credit-card'
const FIELDS = [
  { name: 'number', label: 'Card Number' },
  { name: 'expiration_date', label: 'MM/YY' },
  { name: 'security_code', label: 'CVC' },
  { name: 'address.postal_code', label: 'Zip' }
]

/* global HTMLElement */
class CreditCardFrame extends PayTheoryFinixFrame {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

  invalidate(_t) { return _t.isDirty ? _t.errorMessages.length > 0 : undefined }

  connectedCallback() {
    this.eventful = this.eventful.bind(this);
    this.badge = '';
    this.bin = {};
    if (!this.loaded) {
      console.log('loading', this.id);
      this.loaded = true;
      this.formed = window.PaymentForm.card((state, binInformation) => {
        if (binInformation) {
          this.cardBrand = binInformation.cardBrand;
          this.bin = binInformation;
          if (binInformation.cardBrand !== this.badge) {
            this.badge = binInformation.cardBrand;
            const badger = document.createElement('div');
            badger.setAttribute(
              'class',
              `pay-theory-card-badge pay-theory-card-${binInformation.cardBrand}`,
            );
            const badged = document.getElementById('badge-wrapper');
            badged.innerHTML = '';
            badged.appendChild(badger);
          }
        }

        if (state) {
          const num = this.invalidate(state.number);
          const date = this.invalidate(state.expiration_date);
          const code = this.invalidate(state.security_code);

          const invalid = num ?
            state.number.errorMessages[0] :
            code ?
            state.security_code.errorMessages[0] :
            date ?
            state.expiration_date.errorMessages[0] :
            false;

          this.error = invalid;
          this.valid = this.error // if there is an error
            ?
            false // valid is false
            :
            typeof code === 'undefined' ||
            typeof date === 'undefined' ||
            typeof num === 'undefined' // otherwise if any values are undefined
            ?
            undefined // valid is undefined
            :
            typeof date === 'undefined' // otherwise if date is defined
            ?
            typeof code === 'undefined' // otherwise if code is defined
            :
            !num // otherwise valid is nums validation
            ?
            !date // valid is codes validation
            :
            !date; // valid is dates validation
        }
      });
      window.postMessage({
          type: 'ready',
          ready: true,
        },
        window.location.origin,
      );
      this.ready = true;
    }
    window.addEventListener('message', this.eventful);
    this.innerHTML = `<span class="framed">
            <div id="pay-theory-${this.field}-field-container" class="pay-theory-field">
            </div>
        </span>`

    this.defineFields(this.form, this.styling);
  }

  get cardBrand() {
    return this.cardBranded;
  }

  set cardBrand(_cardBranded) {
    this.cardBranded = _cardBranded;
  }

  get bin() {
    return this.hasBin;
  }

  set bin(_hasBin) {
    this._hasBin = _hasBin;
  }

  get validCreditCardNumber() {
    return this.validCCN;
  }

  set validCreditCardNumber(isValid) {
    this.validCCN = isValid;
  }

  get validCreditCardCode() {
    return this.validCCC;
  }

  set validCreditCardCode(isValid) {
    this.validCCC = isValid;
  }

  get validCreditCardExp() {
    return this.validCCE;
  }

  set validCreditCardExp(isValid) {
    this.validCCE = isValid;
  }

  get transact() {
    return this.transacting;
  }

  set transact(_transacting) {
    if (this.transacting !== _transacting) {
      this.transacting = _transacting;
      this.form.submit('sandbox', process.env.APP_ID, (err, res) => {
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
