const fields = [{ name: 'security_code', label: 'CVC' }]

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

const defaultStyles = { default: {}, success: {}, error: {} }

/* global HTMLElement */
class CreditCardSecurityFrame extends HTMLElement {
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

    get validCreditCardCode() {
        return this.validCCC
    }

    set validCreditCardCode(isValid) {
        this.validCCC = isValid
    }

    get valid() {
        return this.validated
    }

    set valid(isValid) {
        if (isValid !== this.validated) {
            this.validated = isValid
            window.postMessage({
                    type: 'cvv-valid',
                    valid: isValid
                },
                window.location.origin
            )
        }
    }

    connectedCallback() {
        this.eventful = this.eventful.bind(this)

        if (!this.loaded) {
            this.loaded = true

            window.postMessage({
                    type: 'cvv-ready',
                    ready: true
                },
                window.location.origin
            )
            this.ready = true
        }
        window.addEventListener('message', this.eventful)
        this.innerHTML = `<span class="framed">
            <div class="pay-theory-card-field">
              <div id="field-wrapper-security_code" class="field-wrapper"></div>
            </div>
        </span>`


        defineFields(this.form, this.styling)
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

if (!window.customElements.get('paytheory-credit-card-cvv-tag-frame')) {
    window.customElements.define(
        'paytheory-credit-card-cvv-tag-frame',
        CreditCardSecurityFrame
    )
}
