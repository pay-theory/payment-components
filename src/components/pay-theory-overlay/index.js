/* global HTMLElement */
import common from "../../common";
import {payTheoryOverlay} from "../../common/data";

class PayTheoryOverlay extends HTMLElement {
    constructor() {
        super();
        this.defineOverlay = this.defineOverlay.bind(this);
    }

    defineOverlay() {
        const overlayFrame = document.createElement('iframe')
        overlayFrame.setAttribute('src', `${common.hostedFieldsEndpoint()}/overlay`)
        overlayFrame.setAttribute('frameBorder', '0')
        overlayFrame.setAttribute('name', `pay-theory-overlay-iframe`)
        overlayFrame.setAttribute('id', common.payTheoryOverlay)
        document.body.append(overlayFrame)
    }

    connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        this._clearCancelListener = common.handleHostedFieldMessage(common.overlayCancelTypeMessage, this._onCancel)
        this._clearFocusListener = common.handleHostedFieldMessage(common.overlayRelaunchTypeMessage, this._onFocus)
    }

    disconnectedCallback() {
        super.disconnectedCallback && super.disconnectedCallback();
        this._clearCancelListener()
        this._clearFocusListener()
    }

    get onCancel() {
        return this._onCancel
    }

    set onCancel(cancelFunc) {
        this._onCancel = cancelFunc
    }

    set clearCancelListener(clearCancelFunc) {
        this._clearCancelListener = clearCancelFunc
    }

    get clearCancelListener() {
        return this._clearCancelListener
    }

    set onFocus(focusFunc) {
        this._onFocus = focusFunc
    }

    get onFocus() {
        return this._onFocus
    }

    set clearFocusListener(clearFocusFunc) {
        this._clearFocusListener =  clearFocusFunc
    }

    get clearFocusListener() {
        return this._clearFocusListener
    }


}

window.customElements.define("pay-theory-overlay", PayTheoryOverlay);