/* global HTMLElement */
/* eslint-disable no-unused-vars */

import common from '../../common';
//@ts-expect-error - TS doesn't know about DOMPurify
import DOMPurify from 'dompurify';
import { ElementTypes } from '../../common/data';
import { StyleObject } from '../../common/pay_theory_types';

export type placeholderObject = Partial<Record<ElementTypes, string>>;

class PayTheoryHostedField extends HTMLElement {
  protected _field: ElementTypes | undefined;
  protected _styles: StyleObject = common.defaultStyles;
  protected fields: Partial<ElementTypes[]>;
  protected _placeholders: placeholderObject = {};
  protected _amount: number | undefined;
  protected _country: string | undefined;

  // Used to store the session id for a connected session from our hosted checkout
  protected _session: string | undefined;

  constructor() {
    super();
    this.defineFields = this.defineFields.bind(this) as (token: string) => void;
    this.appendElement = this.appendElement.bind(this) as (element: HTMLElement) => void;
    this.setFields = this.setFields.bind(this) as (fieldArray: ElementTypes[]) => void;
    this.createToken = this.createToken.bind(this) as () => string;
    this.fields = [];
  }

  setFields(fieldArray: ElementTypes[]) {
    this.fields = fieldArray;
  }

  setFieldName(name: ElementTypes) {
    this._field = name;
  }

  get field() {
    return this._field;
  }

  createToken() {
    const token = {
      origin: window.location.origin,
      styles: this._styles,
      placeholders: this._placeholders,
      amount: this._amount,
      country: this._country,
    };
    const json = JSON.stringify(token);
    const encodedJson = window.btoa(json);
    return encodeURI(encodedJson);
  }

  defineFields(token: string) {
    this.fields.forEach(field => {
      const wrapper = `field-wrapper-${field?.replace(/\./, '-')}`;
      const wrapperElement = document.createElement('div');
      wrapperElement.setAttribute('id', wrapper);
      wrapperElement.setAttribute('class', 'field-wrapper');

      const f = document.createElement('iframe');
      f.setAttribute('src', `${common.hostedFieldsEndpoint}/${field}?token=${token}`);
      f.setAttribute('frameBorder', '0');
      f.setAttribute('name', `${field}-iframe`);
      f.setAttribute('id', `${field}-iframe`);
      wrapperElement.appendChild(f);
      this.appendElement(wrapperElement);
    });
  }

  appendElement(element: HTMLElement) {
    const container = document.getElementById(`pay-theory-${this.field}-hosted-field-container`);
    container?.appendChild(element);
  }

  connectedCallback() {
    // eslint-disable-next-line no-unsanitized/property
    this.innerHTML = DOMPurify.sanitize(`<div class="framed">
            <div id="pay-theory-${this.field}-hosted-field-container" class="pay-theory-field">
            </div>
        </div>`);
    const token = this.createToken();
    this.defineFields(token);
  }

  set session(value: string) {
    this._session = value;
  }

  set styles(value: StyleObject | undefined) {
    if (value) {
      this._styles = value;
    } else {
      this._styles = { default: {}, success: {}, error: {} };
    }
  }

  set placeholders(value: placeholderObject) {
    if (value) {
      this._placeholders = value;
    } else {
      this._placeholders = {};
    }
  }
}

export default PayTheoryHostedField;
