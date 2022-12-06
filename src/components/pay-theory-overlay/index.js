/* global HTMLElement */
import common from "../../common";

class PayTheoryOverlay extends HTMLElement {
    constructor() {
        super();
        this._onFocus = () => {}
        this._onCancel = () => {}
    }

    connectedCallback() {
        super.connectedCallback && super.connectedCallback();

        // Creating the iFrame for the overlay
        const overlayFrame = document.createElement('iframe')
        overlayFrame.setAttribute('src', `${common.hostedFieldsEndpoint()}/overlay?token=${this._token}`)
        overlayFrame.setAttribute('frameBorder', '0')
        overlayFrame.setAttribute('name', `pay-theory-overlay-iframe`)
        overlayFrame.setAttribute('id', common.payTheoryOverlay)
        this.append(overlayFrame)

        // Adding the event listeners for the overlay
        this._clearCancelListener = common.handleHostedFieldMessage(common.overlayCancelTypeMessage, this._onCancel)
        this._clearFocusListener = common.handleHostedFieldMessage(common.overlayRelaunchTypeMessage, this._onFocus)
    }

    disconnectedCallback() {
        super.disconnectedCallback && super.disconnectedCallback();
        this._clearCancelListener()
        this._clearFocusListener()
    }

    // Only want to allow event listeners to be set from outside the class
    // If they have been set before there should be a clear listener function so we want to clear it and reset the listener
    set onCancel(cancelFunc) {
        this._onCancel = cancelFunc
        if(this._clearCancelListener) {
            this._clearCancelListener()
            this._clearCancelListener = common.handleHostedFieldMessage(common.overlayCancelTypeMessage, this._onCancel)
        }
    }

    set onFocus(focusFunc) {
        this._onFocus = focusFunc
        if(this._clearFocusListener) {
            this._clearFocusListener()
            this._clearFocusListener = common.handleHostedFieldMessage(common.overlayRelaunchTypeMessage, this._onFocus)
        }
    }

    setToken(tokened) {
        this._token = tokened
    }
}

window.customElements.define(common.payTheoryOverlay, PayTheoryOverlay);