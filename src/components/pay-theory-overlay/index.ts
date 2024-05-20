/* global HTMLElement */
import common from '../../common';

class PayTheoryOverlay extends HTMLElement {
  protected _token: string | undefined;
  protected _onFocus: () => void;
  protected _onCancel: () => void;
  protected _clearFocusListener: () => void = () => {};
  protected _clearCancelListener: () => void = () => {};

  constructor() {
    super();
    this._onFocus = () => {};
    this._onCancel = () => {};
  }

  defineOverlay() {
    // Creating the iFrame for the overlay
    const overlayFrame = document.createElement('iframe');
    overlayFrame.setAttribute('src', `${common.hostedFieldsEndpoint}/overlay?token=${this._token}`);
    overlayFrame.setAttribute('frameBorder', '0');
    overlayFrame.setAttribute('name', `pay-theory-overlay-iframe`);
    overlayFrame.setAttribute('id', common.payTheoryOverlay);
    this.append(overlayFrame);
  }

  connectedCallback() {
    // Adding the event listeners for the overlay
    this._clearCancelListener = common.handleHostedFieldMessage(
      common.overlayCancelTypeMessage,
      this._onCancel,
    );
    this._clearFocusListener = common.handleHostedFieldMessage(
      common.overlayRelaunchTypeMessage,
      this._onFocus,
    );
  }

  disconnectedCallback() {
    this._clearCancelListener();
    this._clearFocusListener();
  }

  // Only want to allow event listeners to be set from outside the class
  // If they have been set before there should be a clear listener function so we want to clear it and reset the listener
  set onCancel(cancelFunc: () => void) {
    this._onCancel = cancelFunc;
    if (this._clearCancelListener) {
      this._clearCancelListener();
      this._clearCancelListener = common.handleHostedFieldMessage(
        common.overlayCancelTypeMessage,
        this._onCancel,
      );
    }
  }

  set onFocus(focusFunc: () => void) {
    this._onFocus = focusFunc;
    if (this._clearFocusListener) {
      this._clearFocusListener();
      this._clearFocusListener = common.handleHostedFieldMessage(
        common.overlayRelaunchTypeMessage,
        this._onFocus,
      );
    }
  }

  set token(urlToken: string) {
    this._token = urlToken;
    this.defineOverlay();
  }
}

window.customElements.define(common.payTheoryOverlay, PayTheoryOverlay);

export default PayTheoryOverlay;
