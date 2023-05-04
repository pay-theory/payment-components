/* global HTMLElement */
import common from "../../common";

class PayTheoryCheckoutQR extends HTMLElement {
    protected _token: string | undefined
    protected _size: number | undefined
    protected _onReady: () => void
    protected _onClick: () => void
    protected _onError: () => void
    protected _onSuccess: () => void
    protected _clearReadyListener: () => void = () => {}
    protected _clearSuccessListener: () => void = () => {}

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
        qrFrame.setAttribute('src', `${common.hostedFieldsEndpoint}/checkout_qr?token=${this._token}`)
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
        // Creating the listeners from the hosted qr page
        this._clearReadyListener = common.handleHostedFieldMessage(common.qrCodeReadyTypeMessage, this._onReady)
        this._clearSuccessListener = common.handleHostedFieldMessage(common.qrCodeCompleteTypeMessage, this._onSuccess)
    }

    disconnectedCallback() {
        this._clearSuccessListener()
        this._clearReadyListener()
    }

    // Only want to allow event listeners to be set from outside the class
    // If they have been set before there should be a clear listener function so we want to clear it and reset the listener
    set onReady(readyFunc: () => void) {
        this._onReady = readyFunc
        if(this._clearReadyListener) {
            this._clearReadyListener()
            this._clearReadyListener = common.handleHostedFieldMessage(common.qrCodeReadyTypeMessage, this._onReady)
        }
    }

    set onSuccess(successFunc: () => void) {
        this._onSuccess = successFunc
        if(this._clearSuccessListener) {
            this._clearSuccessListener()
            this._clearSuccessListener = common.handleHostedFieldMessage(common.qrCodeCompleteTypeMessage, this._onSuccess)
        }
    }

    set token(value: string) {
        this._token = value
        this.defineQR()
    }

    set size(value: number) {
        this._size = value
        const iframe = document.getElementById(`${common.checkoutQRField}-iframe`) as HTMLIFrameElement
        if(iframe) {
            iframe.height = `${this._size}px`
            iframe.width = `${this._size}px`
        }
    }
}

window.customElements.define(common.checkoutQRField, PayTheoryCheckoutQR);