/* global HTMLElement */
import common from "../../common";
import {checkoutButtonField} from "../../common/data";

class PayTheoryCheckoutQR extends HTMLElement {
    constructor() {
        super();
        this._onReady = () => {}
        this._onClick = () => {}
        this._onError = () => {}
        this._onSuccess = () => {}
    }

    defineQR() {
        // Creating the iFrame for the Button
        const qrFrame = document.createElement('iframe')
        qrFrame.setAttribute('src', `${common.hostedFieldsEndpoint()}/checkout_qr?token=${this._token}`)
        qrFrame.setAttribute('frameBorder', '0')
        qrFrame.setAttribute('name', common.checkoutQRField)
        qrFrame.setAttribute('id', `${common.checkoutQRField}-iframe`)
        if(this._size) {
            qrFrame.height = `${this._size}px`
            qrFrame.width = `${this._size}px`
        }
        this.append(qrFrame)
    }

    connectedCallback() {
        super.connectedCallback && super.connectedCallback();

        // Creating the listeners from the hosted qr page
        this._clearReadyListener = common.handleHostedFieldMessage(common.qrCodeReadyTypeMessage, this._onReady)
        this._clearSuccessListener = common.handleHostedFieldMessage(common.qrCodeCompleteTypeMessage, this._onSuccess)
    }

    disconnectedCallback() {
        super.disconnectedCallback && super.disconnectedCallback();
        this._clearSuccessListener()
        this._clearReadyListener()
    }

    // Only want to allow event listeners to be set from outside the class
    // If they have been set before there should be a clear listener function so we want to clear it and reset the listener
    set onReady(readyFunc) {
        this._onReady = readyFunc
        if(this._clearReadyListener) {
            this._clearReadyListener()
            this._clearReadyListener = common.handleHostedFieldMessage(common.qrCodeReadyTypeMessage, this._onReady)
        }
    }

    set onSuccess(successFunc) {
        this._onSuccess = successFunc
        if(this._clearSuccessListener) {
            this._clearSuccessListener()
            this._clearSuccessListener = common.handleHostedFieldMessage(common.qrCodeCompleteTypeMessage, this._onSuccess)
        }
    }

    set token(urlToken) {
        this._token = urlToken
        this.defineQR()
    }

    set size(passedSize) {
        this._size = passedSize
        const iframe = document.getElementById(`${common.checkoutQRField}-iframe`)
        if(iframe) {
            iframe.height = `${this._size}px`
            iframe.width = `${this._size}px`
        }
    }
}

window.customElements.define(common.checkoutQRField, PayTheoryCheckoutQR);