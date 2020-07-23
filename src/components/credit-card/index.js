const fields = [
    { name: 'number', label: 'Card Number' },
    { name: 'expiration_date', label: 'Exp' },
    { name: 'security_code', label: 'CVC' },
    { name: 'address.postal_code', label: 'Zip' }
]

const defineFields = (form, styles, element) => {
    fields.forEach((field) => {
        const named = (typeof element === 'undefined') ? field.name : `${element}-${field.name}`
        const f = form.field(field.name, {
            placeholder: field.label,
            styles: {
                default: styles.default,
                success: styles.success ? styles.success : styles.default,
                error: styles.error ? styles.error : styles.default
            }
        })
        const idd = `field-wrapper-${named.replace(/\./, '-')}`

        if (document.getElementById(idd)) {

            document.getElementById(idd).appendChild(f)
        }
    })
}

let undef

const invalidate = (_t) => (_t.isDirty ? _t.errorMessages.length > 0 : undef)

const defaultStyles = { default: {}, success: {}, error: {} }

/* global HTMLElement */
class CreditCardFrame extends HTMLElement {
    eventful(event) {
        if (![window.location.origin].includes(event.origin)) {
            return
        }
        const message =
            typeof event.data === 'object' ? event.data : { type: 'unknown' }
        this[message.type] = event.data[message.type]
    }


    get id() {
        return this.getAttribute('id')
    }

    set id(_elementId) {
        if (_elementId) {
            this.setAttribute('id', _elementId)
        }
        else {
            this.removeAttribute('id')
        }
    }

    get loaded() {
        return this.isLoaded
    }

    set loaded(_isLoaded) {
        this.isLoaded = _isLoaded
    }

    get ready() {
        return this.isReady
    }

    set ready(_isReady) {
        this.isReady = _isReady
    }

    get styles() {
        return this.styling
    }

    set styles(_styling) {
        if (_styling && !this.defined) {
            this.defined = true
            console.log('defining with style', this.id)
            defineFields(this.formed, _styling, this.id)
            this.styling = _styling
        }
        else if (!this.defined) {
            this.defined = true
            console.log('defining without style')
            defineFields(this.formed, defaultStyles, this.id)
            this.styling = defaultStyles
        }
    }

    get transact() {
        return this.transacting
    }

    set transact(_transacting) {
        if (this.transacting !== _transacting) {
            this.transacting = _transacting
            this.formed.submit('sandbox', 'APbu7tPrKJWHSMDh7M65ahft', (err, res) => {
                if (err) {
                    this.error = err
                }
                else {
                    const tokenized = { bin: this.bin, ...res }
                    window.postMessage({
                            type: 'tokenized',
                            tokenized
                        },
                        window.location.origin
                    )
                }
            })
        }
    }

    get cardBrand() {
        return this.cardBranded
    }

    set cardBrand(_cardBranded) {
        this.cardBranded = _cardBranded
    }

    get bin() {
        return this.hasBin
    }

    set bin(_hasBin) {
        this._hasBin = _hasBin
    }

    get error() {
        return this.errored
    }

    set error(_errored) {
        if (this.errored !== _errored) {
            this.errored = _errored
            window.postMessage({
                    type: 'error',
                    error: _errored
                },
                window.location.origin
            )
        }
    }

    get validCreditCardNumber() {
        return this.validCCN
    }

    set validCreditCardNumber(isValid) {
        this.validCCN = isValid
    }

    get validCreditCardCode() {
        return this.validCCC
    }

    set validCreditCardCode(isValid) {
        this.validCCC = isValid
    }

    get validCreditCardExp() {
        return this.validCCE
    }

    set validCreditCardExp(isValid) {
        this.validCCE = isValid
    }

    get valid() {
        return this.validated
    }

    set valid(isValid) {
        if (isValid !== this.validated) {
            this.validated = isValid
            window.postMessage({
                    type: 'valid',
                    valid: isValid
                },
                window.location.origin
            )
        }
    }

    connectedCallback() {
        this.eventful = this.eventful.bind(this)
        this.badge = ''
        this.bin = {}
        if (!this.loaded) {
            console.log('loading', this.id)
            this.loaded = true
            this.formed = window.PaymentForm.card((state, binInformation) => {
                if (binInformation) {
                    this.cardBrand = binInformation.cardBrand
                    this.bin = binInformation
                    if (binInformation.cardBrand !== this.badge) {
                        this.badge = binInformation.cardBrand
                        const badger = document.createElement('div')
                        badger.setAttribute(
                            'class',
                            `paytheory-card-badge paytheory-card-${binInformation.cardBrand}`
                        )
                        const badged = document.getElementById('badge-wrapper')
                        badged.innerHTML = ''
                        badged.appendChild(badger)
                    }
                }

                if (state) {
                    const num = invalidate(state.number)
                    const date = invalidate(state.expiration_date)
                    const code = invalidate(state.security_code)

                    const invalid = num ?
                        state.number.errorMessages[0] :
                        code ?
                        state.security_code.errorMessages[0] :
                        date ?
                        state.expiration_date.errorMessages[0] :
                        false

                    this.error = invalid
                    this.valid = this.error // if there is an error
                        ?
                        false // valid is false
                        :
                        typeof code === 'undefined' ||
                        typeof date === 'undefined' ||
                        typeof num === 'undefined' // otherwise if any values are undefined
                        ?
                        undef // valid is undefined
                        :
                        typeof date === 'undefined' // otherwise if date is defined
                        ?
                        typeof code === 'undefined' // otherwise if code is defined
                        :
                        !num // otherwise valid is nums validation
                        ?
                        !date // valid is codes validation
                        :
                        !date // valid is dates validation
                }
            })
            window.postMessage({
                    type: 'ready',
                    ready: true
                },
                window.location.origin
            )
            this.ready = true
        }
        window.addEventListener('message', this.eventful)
        this.innerHTML = `<span class="framed">
            <div class="pay-theory-card-field">
              <div id="field-wrapper-${this.id}-number" class="field-wrapper"></div>
              <div id="field-wrapper-${this.id}-expiration_date" class="field-wrapper"></div>
              <div id="field-wrapper-${this.id}-security_code" class="field-wrapper"></div>
              <div id="field-wrapper-${this.id}-address-postal_code" class="field-wrapper"></div>
              <div id="badge-wrapper" />
            </div>
        </span>`
    }

    disconnectedCallback() {
        document.removeEventListener('message', this.eventful)
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
        if (newValue !== oldValue) {
            this[attrName.toString()] = this.hasAttribute(attrName)
        }
    }
}

if (!window.customElements.get('paytheory-credit-card-tag-frame')) {
    window.customElements.define(
        'paytheory-credit-card-tag-frame',
        CreditCardFrame
    )
}
