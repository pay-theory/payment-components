import '../../tags.css'
import * as formed from '../../form-generator'
const fields = [{ name: 'credit-card-account-name', label: 'Name on card' }]

const defineFields = (form, styles) => {
    fields.forEach((field) => {
        const f = form.accountName({
            placeholder: field.label,
            styles: {
                default: styles.default,
                success: styles.success ? styles.success : styles.default,
                error: styles.error ? styles.error : styles.default
            }
        })
        const idd = `field-wrapper-${field.name.replace(/\./, '-')}`

        if (document.getElementById(idd))
            document.getElementById(idd).appendChild(f)
    })
}

const defaultStyles = { default: {}, success: {}, error: {} }

/* global HTMLElement */
class AccountNameFrame extends HTMLElement {
    eventful(event) {
        if (![window.location.origin].includes(event.origin)) return
        const message =
            typeof event.data === 'object' ? event.data : { type: 'unknown' }
        this[message.type] = event.data[message.type]
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
        console.log(JSON.stringify(formed))
        if (_styling && formed) {
            defineFields(formed, _styling)
            this.styling = _styling
        } else if (formed) {
            defineFields(formed, defaultStyles)
            this.styling = defaultStyles
        }
    }

    get transact() {
        return this.transacting
    }

    set transact(_transacting) {
        if (this.transacting !== _transacting) {
            this.transacting = _transacting
            formed.submit('APbu7tPrKJWHSMDh7M65ahft', (err, res) => {
                if (err) {
                    this.error = err
                } else {
                    const tokenized = { bin: this.bin, ...res }
                    window.postMessage(
                        {
                            type: 'tokenized',
                            tokenized: tokenized
                        },
                        window.location.origin
                    )
                }
            })
        }
    }

    get error() {
        return this.errored
    }

    set error(_errored) {
        if (this.errored !== _errored) {
            this.errored = _errored
            window.postMessage(
                {
                    type: 'error',
                    error: _errored
                },
                window.location.origin
            )
        }
    }

    get valid() {
        return this.validated
    }

    set valid(isValid) {
        if (isValid !== this.validated) {
            this.validated = isValid
            window.postMessage(
                {
                    type: 'valid',
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

            window.postMessage(
                {
                    type: 'ready',
                    ready: true
                },
                window.location.origin
            )
            this.ready = true
        }
        window.addEventListener('message', this.eventful)
        this.innerHTML = `<span class="framed">
            <div class="pay-theory-credit-card-account-name-field">
              <div id="field-wrapper-credit-card-account-name" class="field-wrapper"></div>
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

if (
    !window.customElements.get('paytheory-credit-card-account-name-tag-frame')
) {
    window.customElements.define(
        'paytheory-credit-card-account-name-tag-frame',
        AccountNameFrame
    )
}
