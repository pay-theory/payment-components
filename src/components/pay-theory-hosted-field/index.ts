/* global HTMLElement */
import common from '../../common'
// @ts-ignore
import DOMPurify from 'dompurify'
import {elementTypes} from "../../common/data";
import {handleError} from "../../common/message";

export type styleObject = {
  default: object;
  success: object;
  error: object;
  radio?: {
    width: number;
    fill: string;
    stroke: string;
    text: {
      fontSize: string;
      color: string;
    }
  }
  hidePlaceholder?: boolean;
}

export type placeholderObject = Partial<Record<elementTypes, string>>

class PayTheoryHostedField extends HTMLElement {
  protected _field: elementTypes | undefined
  protected _styles: styleObject = common.defaultStyles
  protected fields: Partial<Array<elementTypes>>
  protected _placeholders: placeholderObject = {}
  constructor() {
    super()
    this.appendElement = this.appendElement.bind(this)
    this.setFields = this.setFields.bind(this)
    this.createToken = this.createToken.bind(this)
    this.fields = []
  }

  setFields(fieldArray: Array<elementTypes>) {
    this.fields = fieldArray
  }

  setFieldName(name: elementTypes) {
    this._field = name
  }

  get field() {
    return this._field
  }

  createToken() {
    const token = {
      origin: window.location.origin,
      styles: this._styles,
      placeholders: this._placeholders
    }
    const json = JSON.stringify(token)
    const encodedJson = window.btoa(json)
    return encodeURI(encodedJson)
  }

  appendElement(element: HTMLElement) {
    const container = document.getElementById(`pay-theory-${this.field}-hosted-field-container`)
    container?.appendChild(element)
  }

  setiFrameSrc() {
    const token = this.createToken()
    this.fields.forEach(field => {
      const iframeUrl = `${common.hostedFieldsEndpoint}/${field}?token=${token}`
      const iframe = document.getElementById(`${field}-iframe`)
      iframe?.setAttribute('src', iframeUrl)
    })
  }

  connectedCallback() {
    this.innerHTML = DOMPurify.sanitize(`<div class="framed">
            <div id="pay-theory-${this.field}-hosted-field-container" class="pay-theory-field">
            </div>
        </div>`)
    this.fields.forEach(field => {
      const wrapper = `field-wrapper-${field?.replace(/\./, '-')}`
      const wrapperElement = document.createElement('div')
      wrapperElement.setAttribute('id', wrapper)
      wrapperElement.setAttribute('class', 'field-wrapper')

      const f = document.createElement('iframe')
      f.setAttribute('frameBorder', '0')
      f.setAttribute('name', `${field}-iframe`)
      f.setAttribute('id', `${field}-iframe`)
      wrapperElement.appendChild(f)
      this.appendElement(wrapperElement)
    })
    this.setiFrameSrc()
  }

  disconnectedCallback() {

  }

  set styles(value: styleObject) {
    if (value) {
      this._styles = value;
    }
    else {
      this._styles = { default: {}, success: {}, error: {} };
    }
  }

  set placeholders(value: placeholderObject) {
    if (value) {
      this._placeholders = value;
    }
    else {
      this._placeholders = {};
    }
  }
}

export default PayTheoryHostedField
