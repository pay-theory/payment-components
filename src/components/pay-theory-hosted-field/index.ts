/* global HTMLElement */
import common from '../../common'
// @ts-ignore
import DOMPurify from 'dompurify'
import {elementTypes} from "../../common/data";

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
    this.defineFields = this.defineFields.bind(this)
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

  defineFields(token: string) {
    this.fields.forEach(field => {
      const wrapper = `field-wrapper-${field?.replace(/\./, '-')}`
      const wrapperElement = document.createElement('div')
      wrapperElement.setAttribute('id', wrapper)
      wrapperElement.setAttribute('class', 'field-wrapper')

      const f = document.createElement('iframe')
      f.setAttribute('src', `${common.hostedFieldsEndpoint}/${field}?token=${token}`)
      f.setAttribute('frameBorder', '0')
      f.setAttribute('name', `${field}-iframe`)
      wrapperElement.appendChild(f)
      this.appendElement(wrapperElement)
    })
  }

  appendElement(element: HTMLElement) {
    const container = document.getElementById(`pay-theory-${this.field}-hosted-field-container`)
    container?.appendChild(element)
  }

  connectedCallback() {
    this.innerHTML = DOMPurify.sanitize(`<div class="framed">
            <div id="pay-theory-${this.field}-hosted-field-container" class="pay-theory-field">
            </div>
        </div>`)
    const token = this.createToken()
    this.defineFields(token)
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
