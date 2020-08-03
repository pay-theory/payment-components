/* global HTMLElement */
class PayTheoryFinixFrame extends HTMLElement {

  constructor() {
    super()
    this.setFields = this.setFields.bind(this)
    this.eventful = this.eventful.bind(this)
    this.defaultStyles = { default: {}, success: {}, error: {} }
    this.application = process.env.APP_ID
    this.fields = []
    this.wrappers = []
  }

  setFields(fieldArray) {
    this.fields = fieldArray
  }

  defineFields(form, styles) {
    this.fields.forEach(field => {
      const wrapper = `field-wrapper-${field.name.replace(/\./, '-')}`
      const wrapperElement = document.createElement('div')
      wrapperElement.setAttribute('id', wrapper)
      wrapperElement.setAttribute('class', 'field-wrapper')

      const f = form.field(field.name, {
        placeholder: field.label,
        styles: {
          default: styles.default,
          success: styles.success ? styles.success : styles.default,
          error: styles.error ? styles.error : styles.default,
        },
      })

      wrapperElement.appendChild(f)

      const container = document.getElementById(`pay-theory-${this.field}-field-container`)

      container.appendChild(wrapperElement)
    })
  }

  eventful(event) {
    if (![window.location.origin].includes(event.origin)) {
      return
    }
    const message = typeof event.data === 'object' ? event.data : { type: 'unknown' }
    if (message.type.startsWith(this.field) && message.type.endsWith('-ready')) {
      this.ready = event.data[message.type]
    }
    else if (message.type.startsWith(this.field) && message.type.endsWith('-valid')) {
      this.valid = event.data[message.type]
    }
    else {
      this[message.type] = event.data[message.type]
    }
  }

  connectedCallback() {
    if (!this.loaded) {
      this.loaded = true

      window.postMessage({
          type: `${this.field}-ready`,
          ready: true,
        },
        window.location.origin,
      );
      this.ready = true
    }

    window.addEventListener('message', this.eventful)

    this.innerHTML = `<span class="framed">
            <div id="pay-theory-${this.field}-field-container" class="pay-theory-field">
            </div>
        </span>`

    this.defineFields(this.formed, this.styling)
  }

  disconnectedCallback() {
    return document.removeEventListener('message', this.eventful)
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (newValue !== oldValue) {
      this[attrName.toString()] = this.hasAttribute(attrName)
    }
  }

  get form() {
    return this.formed
  }

  set form(_formed) {
    this.formed = _formed
  }

  get application() {
    return this.applicationId
  }

  set application(_applicationId) {
    this.applicationId = _applicationId
  }

  get field() {
    return this.fielded
  }

  set field(_fielded) {
    this.fielded = _fielded
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
    if (_isReady !== this.isReady) {
      this.isReady = _isReady
      window.postMessage({
          type: `${this.field}-ready`,
          ready: this.isReady,
        },
        window.location.origin,
      )
    }
  }

  get styles() {
    return this.styling
  }

  set styles(_styling) {
    if (_styling) {
      this.styling = _styling;
    }
    else {
      this.styling = this.defaultStyles;
    }
  }

  get error() {
    return this.errored;
  }

  set error(_errored) {
    if (this.errored !== _errored) {
      this.errored = _errored;
      window.postMessage({
          type: 'error',
          error: _errored,
        },
        window.location.origin,
      );
    }
  }

  get valid() {
    return this.validated;
  }

  set valid(isValid) {
    if (isValid !== this.validated) {
      this.validated = isValid
      window.postMessage({
          type: `${this.field}-valid`,
          valid: isValid,
        },
        window.location.origin,
      )
    }
  }
}

export default PayTheoryFinixFrame
