/* global HTMLElement */
/* eslint-disable no-unused-vars */

import common from '../../common';

class PayTheoryCheckoutQR extends HTMLElement {
  protected _token: string | undefined;
  protected _size: number | undefined;
  protected _onReady: ((message: unknown) => void) | undefined;
  protected _onClick: ((message: unknown) => void) | undefined;
  protected _onError: ((message: unknown) => void) | undefined;
  protected _onSuccess: ((message: unknown) => void) | undefined;
  protected _clearReadyListener: (() => void) | undefined;
  protected _clearSuccessListener: (() => void) | undefined;
  protected _clearErrorListener: (() => void) | undefined;

  defineQR() {
    // Creating the iFrame for the Button
    const qrFrame = document.createElement('iframe');
    qrFrame.setAttribute('src', `${common.hostedFieldsEndpoint}/checkout_qr?token=${this._token}`);
    qrFrame.setAttribute('frameBorder', '0');
    qrFrame.setAttribute('name', common.checkoutQRField);
    qrFrame.setAttribute('id', `${common.checkoutQRField}-iframe`);
    if (this._size) {
      qrFrame.height = `${this._size}px`;
      qrFrame.width = `${this._size}px`;
    }
    this.append(qrFrame);
  }

  connectedCallback() {
    // Creating the listeners from the hosted qr page
    this._clearReadyListener = common.handleHostedFieldMessage(
      common.qrCodeReadyTypeMessage,
      this._onReady,
    );
    this._clearSuccessListener = common.handleHostedFieldMessage(
      common.qrCodeCompleteTypeMessage,
      this._onSuccess,
    );
    this._clearErrorListener = common.handleHostedFieldMessage(
      common.errorTypeMessage,
      this._onError,
    );
  }

  disconnectedCallback() {
    if (this._clearSuccessListener) this._clearSuccessListener();
    if (this._clearReadyListener) this._clearReadyListener();
    if (this._clearErrorListener) this._clearErrorListener();
  }

  // Only want to allow event listeners to be set from outside the class
  // If they have been set before there should be a clear listener function so we want to clear it and reset the listener
  set onReady(readyFunc: (message: unknown) => void) {
    this._onReady = readyFunc;
  }

  set onSuccess(successFunc: (message: unknown) => void) {
    this._onSuccess = successFunc;
  }

  set onError(errorFunc: (message: unknown) => void) {
    this._onError = errorFunc;
  }

  set token(value: string) {
    this._token = value;
    this.defineQR();
  }

  set size(value: number) {
    this._size = value;
    const iframe = document.getElementById(`${common.checkoutQRField}-iframe`) as
      | HTMLIFrameElement
      | undefined;
    if (iframe) {
      iframe.height = `${this._size}px`;
      iframe.width = `${this._size}px`;
    }
  }
}

window.customElements.define(common.checkoutQRField, PayTheoryCheckoutQR);

export default PayTheoryCheckoutQR;
