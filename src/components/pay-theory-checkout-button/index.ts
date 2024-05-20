/* global HTMLElement */
import common from '../../common';
import { SuccessfulTransactionObject } from '../../common/pay_theory_types';

class PayTheoryCheckoutButton extends HTMLElement {
  protected _token: string | undefined;
  protected _onReady: (ready: { sessionId?: string }) => void;
  protected _onClick: () => void;
  protected _onError: (error: string) => void;
  protected _onSuccess: (message: { data: SuccessfulTransactionObject }) => void;
  protected _clearReadyListener: () => void | undefined;
  protected _clearClickListener: () => void | undefined;
  protected _clearErrorListener: () => void | undefined;
  protected _clearSuccessListener: () => void | undefined;
  protected _clearBarcodeReceivedListener: () => void | undefined;
  protected _closeInterval: ReturnType<typeof setInterval> | undefined;
  protected _checkoutWindow: Window | undefined;
  protected _buttonBarcode: string | undefined;
  protected _session: string | undefined;

  constructor() {
    super();
    this._onReady = () => {};
    this._onClick = () => {};
    this._onError = () => {};
    this._onSuccess = () => {};
  }

  defineButton() {
    // Creating the iFrame for the Button
    const buttonFrame = document.createElement('iframe');
    buttonFrame.setAttribute(
      'src',
      `${common.hostedFieldsEndpoint}/checkout_button?token=${this._token}`,
    );
    buttonFrame.setAttribute('frameBorder', '0');
    buttonFrame.setAttribute('name', common.checkoutButtonField);
    buttonFrame.setAttribute('id', `${common.checkoutButtonField}-iframe`);
    this.append(buttonFrame);
  }

  connectedCallback() {
    // Creating the listeners from the hosted checkout page
    this._clearErrorListener = common.handleCheckoutMessage(
      common.checkoutErrorTypeMessage,
      this._onError,
    );
    this._clearSuccessListener = common.handleCheckoutMessage(
      common.checkoutCompleteTypeMessage,
      this._onSuccess,
    );
    this._clearBarcodeReceivedListener = common.handleCheckoutMessage(
      common.checkoutBarcodeReceivedTypeMessage,
      message => {
        this._buttonBarcode = JSON.stringify(message.data);
      },
    );

    // Creating the listeners from the hosted button page
    this._clearReadyListener = common.handleHostedFieldMessage(
      common.buttonReadyTypeMessage,
      this._onReady,
    );
    this._clearClickListener = common.handleHostedFieldMessage(
      common.buttonClickTypeMessage,
      this._onClick,
    );
  }

  disconnectedCallback() {
    this._clearErrorListener();
    this._clearSuccessListener();
    this._clearReadyListener();
    this._clearClickListener();
    this._clearBarcodeReceivedListener();
    if (this._closeInterval) {
      clearInterval(this._closeInterval);
    }
  }

  // Only want to allow event listeners to be set from outside the class
  // If they have been set before there should be a clear listener function so we want to clear it and reset the listener
  set onReady(readyFunc: (ready: { sessionId?: string }) => void) {
    this._onReady = readyFunc;
  }

  set onClick(clickFunc: () => void) {
    this._onClick = clickFunc;
  }

  set onError(errorFunc: (error: string) => void) {
    this._onError = errorFunc;
  }

  set onSuccess(successFunc: (message: { data: SuccessfulTransactionObject }) => void) {
    this._onSuccess = successFunc;
  }

  set token(value: string | undefined) {
    this._token = value;
    this.defineButton();
  }

  set checkoutWindow(window: Window | undefined) {
    this._checkoutWindow = window;
  }

  get checkoutWindow() {
    return this._checkoutWindow;
  }

  set closeInterval(interval) {
    this._closeInterval = interval;
  }

  get closeInterval() {
    return this._closeInterval;
  }

  get session() {
    return this._session;
  }

  set session(value: string | undefined) {
    this._session = value;
  }

  get buttonBarcode() {
    return this._buttonBarcode;
  }

  set buttonBarcode(value: string | undefined) {
    this._buttonBarcode = value;
  }
}

window.customElements.define(common.checkoutButtonField, PayTheoryCheckoutButton);

export default PayTheoryCheckoutButton;
