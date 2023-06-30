/* global HTMLElement */
import common from "../../common";

class PayTheoryCheckoutQR extends HTMLElement {
    protected _token: string | undefined
    protected _size: number | undefined
    protected _onReady: (message: any) => void
    protected _onClick: (message: any) => void
    protected _onError: (message: any) => void
    protected _onSuccess: (message: any) => void
    protected _clearReadyListener: () => void | undefined
    protected _clearSuccessListener: () => void | undefined
    protected _clearErrorListener: () => void | undefined

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
        this._clearErrorListener = common.handleHostedFieldMessage(common.errorTypeMessage, this._onError)
    }

    disconnectedCallback() {
        this._clearSuccessListener()
        this._clearReadyListener()
        this._clearErrorListener()
    }

    // Only want to allow event listeners to be set from outside the class
    // If they have been set before there should be a clear listener function so we want to clear it and reset the listener
    set onReady(readyFunc: (message: any) => void) {
        this._onReady = readyFunc
    }

    set onSuccess(successFunc: (message: any) => void) {
        this._onSuccess = successFunc
    }

    set onError(errorFunc: (message: any) => void) {
        this._onError = errorFunc
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

export default PayTheoryCheckoutQR