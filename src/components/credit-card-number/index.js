const fields = [{ name: 'number', label: 'Number' }]

const defineFields = (form, styles) => {
    fields.forEach((field) => {
        const f = form.field(field.name, {
            placeholder: field.label,
            styles: {
                default: styles.default,
                success: styles.success ? styles.success : styles.default,
                error: styles.error ? styles.error : styles.default
            }
        })
        const idd = `field-wrapper-${field.name.replace(/\./, '-')}`

        if (document.getElementById(idd)) {
            document.getElementById(idd).appendChild(f)
        }
    })
}

let formed

let undef

const invalidate = (_t) => (_t.isDirty ? _t.errorMessages.length > 0 : undef)

const defaultStyles = { default: {}, success: {}, error: {} }

/* global HTMLElement */
class CreditCardNumberFrame extends HTMLElement {
    eventful(event) {
        if (![window.location.origin].includes(event.origin)) {
            return
        }
        const message =
            typeof event.data === 'object' ? event.data : { type: 'unknown' }
        this[message.type] = event.data[message.type]
    }

    get form() {
        return this.formed
    }

    set form(_formed) {
        this.formed = _formed
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
        if (_styling) {
            this.styling = _styling
        }
        else {
            this.styling = defaultStyles
        }
    }

    get transact() {
        return this.transacting
    }

    set transact(_transacting) {
        if (this.transacting !== _transacting) {
            this.transacting = _transacting
            this.form.submit('sandbox', 'APbu7tPrKJWHSMDh7M65ahft', (err, res) => {
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

    get valid() {
        return this.validated
    }

    set valid(isValid) {
        if (isValid !== this.validated) {
            this.validated = isValid
            window.postMessage({
                    type: 'number-valid',
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
            this.loaded = true

            window.postMessage({
                    type: 'number-ready',
                    ready: true
                },
                window.location.origin
            )
            this.ready = true
        }
        window.addEventListener('message', this.eventful)
        this.innerHTML = `<span class="framed">
            <div class="pay-theory-card-field">
              <div id="field-wrapper-number" class="field-wrapper"></div>
              <div id="badge-wrapper" />
            </div>
        </span>`

        defineFields(this.formed, this.styling)
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

if (!window.customElements.get('paytheory-credit-card-number-tag-frame')) {
    window.customElements.define(
        'paytheory-credit-card-number-tag-frame',
        CreditCardNumberFrame
    )
}
