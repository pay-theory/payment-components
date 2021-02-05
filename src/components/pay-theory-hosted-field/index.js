/* global HTMLElement */
import common from '../../common'

class PayTheoryHostedField extends HTMLElement {

  constructor() {
    super()
    this.defineFields = this.defineFields.bind(this)
    this.isValidFrame = this.isValidFrame.bind(this)
    this.appendElement = this.appendElement.bind(this)
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

  defineFields() {
    this.fields.forEach(field => {
      const wrapper = `field-wrapper-${field.name.replace(/\./, '-')}`
      const wrapperElement = document.createElement('div')
      wrapperElement.setAttribute('id', wrapper)
      wrapperElement.setAttribute('class', 'field-wrapper')

      const f = document.createElement('iframe')
      f.setAttribute('src', `${common.hostedFieldsEndpoint(this.environment)}/${field.name}/${this.tokened}`)
      f.setAttribute('frameBorder', '0')
      f.setAttribute('id', `${field.name}-iframe`)

      wrapperElement.appendChild(f)

      this.appendElement(wrapperElement)
    })
  }

  appendElement(element) {
    const container = document.getElementById(`pay-theory-${this.field}-hosted-field-container`)
    container.appendChild(element)
  }

  isValidFrame(invalidElement) {
    return typeof invalidElement === 'undefined' ? invalidElement : !invalidElement
  }

  findEventMessage(event) {
    return typeof event.data === 'object' ? event.data : { type: 'unknown' }
  }

  eventful(event) {
    if ([window.location.origin].includes(event.origin)) {
      const message = this.findEventMessage(event)
      if (typeof message.type === 'string' && message.type.startsWith(this.field) && message.type.endsWith(':ready')) {
        this.ready = event.data.ready
      }
    }
  }

  connectedCallback() {
    if (!this.loaded) {
      this.loaded = true

      window.postMessage({
          type: `pt:${this.field}:ready`,
          ready: true,
        },
        window.location.origin,
      );
      this.ready = true
    }

    window.addEventListener('message', this.eventful)

    this.innerHTML = `<div class="framed">
            <div id="pay-theory-${this.field}-hosted-field-container" class="pay-theory-field">
            </div>
        </div>`


  }



  adoptedCallback() {

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
    this.defineFields()
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

  get token() {
    return this.tokened
  }

  set token(_tokened) {
    this.tokened = _tokened
  }


  get env() {
    return this.environment === undefined ? common.defaultEnvironment : this.environment
  }

  set env(_env) {
    this.environment = _env
  }

  get ready() {
    return this.isReady
  }

  set ready(_isReady) {
    if (_isReady !== this.isReady) {
      this.isReady = _isReady
      window.postMessage({
          type: `pt:${this.field}:ready`,
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

  get state() {
    return this.stated
  }

  set state(_stated) {
    this.stated = _stated
    const invalid = _stated.errorMessages.length > 0
    this.valid = this.isValidFrame(invalid)
    if (_stated.isDirty && invalid) {
      this.error = _stated.errorMessages[0]
    }
    else if (_stated.isDirty) {
      this.error = false
    }

  }

  get error() {
    return this.errored;
  }

  set error(_errored) {
    if (this.errored !== _errored) {
      this.errored = _errored;
      window.postMessage({
          type: 'pt:error',
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
      let type = this.stated.element ? this.stated.element : this.field
      console.log(type)
      window.postMessage({
          type: `pt:${type}:valid`,
          valid: isValid,
          hosted: true
        },
        window.location.origin,
      )
    }
  }
}

export default PayTheoryHostedField
