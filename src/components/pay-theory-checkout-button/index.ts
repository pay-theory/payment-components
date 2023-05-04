/* global HTMLElement */
import common from "../../common";

class PayTheoryCheckoutButton extends HTMLElement {
    protected _token: string | undefined
    protected _onReady: () => void
    protected _onClick: () => void
    protected _onError: () => void
    protected _onSuccess: () => void
    protected _clearReadyListener: () => void = () => {}
    protected _clearClickListener: () => void = () => {}
    protected _clearErrorListener: () => void = () => {}
    protected _clearSuccessListener: () => void = () => {}
    protected _clearBarcodeReceivedListener: () => void = () => {}
    protected _closeInterval: number | undefined
    protected _checkoutWindow: Window | undefined
    protected _buttonBarcode: string | undefined
    protected _buttonSuccess: boolean | undefined

    constructor() {
        super();
        this._onReady = () => {}
        this._onClick = () => {}
        this._onError = () => {}
        this._onSuccess = () => {}
    }

    defineButton() {
        // Creating the iFrame for the Button
        const buttonFrame = document.createElement('iframe')
        buttonFrame.setAttribute('src', `${common.hostedFieldsEndpoint}/checkout_button?token=${this._token}`)
        buttonFrame.setAttribute('frameBorder', '0')
        buttonFrame.setAttribute('name', common.checkoutButtonField)
        buttonFrame.setAttribute('id', `${common.checkoutButtonField}-iframe`)
        this.append(buttonFrame)
    }

    connectedCallback() {
        // Creating the listeners from the hosted checkout page
        this._clearErrorListener = common.handleCheckoutMessage(common.checkoutErrorTypeMessage, this._onError)
        this._clearSuccessListener = common.handleCheckoutMessage(common.checkoutCompleteTypeMessage, this._onSuccess)
        this._clearBarcodeReceivedListener = common.handleCheckoutMessage(common.checkoutBarcodeReceivedTypeMessage, message => {
            this._buttonBarcode = JSON.stringify(message.data)
        })

        // Creating the listeners from the hosted button page
        this._clearReadyListener = common.handleHostedFieldMessage(common.buttonReadyTypeMessage, this._onReady)
        this._clearClickListener = common.handleHostedFieldMessage(common.buttonClickTypeMessage, this._onClick)
    }

    disconnectedCallback() {
        this._clearErrorListener()
        this._clearSuccessListener()
        this._clearReadyListener()
        this._clearClickListener()
        this._clearBarcodeReceivedListener()
        if(this._closeInterval) {
            clearInterval(this._closeInterval)
        }
    }

    // Only want to allow event listeners to be set from outside the class
    // If they have been set before there should be a clear listener function so we want to clear it and reset the listener
    set onReady(readyFunc: () => void) {
        this._onReady = readyFunc
        if(this._clearReadyListener) {
            this._clearReadyListener()
            this._clearReadyListener = common.handleHostedFieldMessage(common.hostedReadyTypeMessage, this._onReady)
        }
    }

    set onClick(clickFunc: () => void) {
        this._onClick = clickFunc
        if(this._clearClickListener) {
            this._clearClickListener()
            this._clearClickListener = common.handleHostedFieldMessage(common.buttonClickTypeMessage, this._onClick)
        }
    }

    set onError(errorFunc: () => void) {
        this._onError = errorFunc
        if(this._clearErrorListener) {
            this._clearErrorListener()
            this._clearErrorListener = common.handleCheckoutMessage(common.checkoutErrorTypeMessage, this._onError)
        }
    }

    set onSuccess(successFunc: () => void) {
        this._onSuccess = successFunc
        if(this._clearSuccessListener) {
            this._clearSuccessListener()
            this._clearSuccessListener = common.handleCheckoutMessage(common.checkoutCompleteTypeMessage, this._onSuccess)
        }
    }

    set token(value: string | undefined) {
        this._token = value
        this.defineButton()
    }

    set checkoutWindow(window: Window | undefined) {
        this._checkoutWindow = window
    }

    get checkoutWindow() {
        return this._checkoutWindow
    }

    set closeInterval(interval) {
        this._closeInterval = interval
    }

    get closeInterval() {
        return this._closeInterval
    }
}

window.customElements.define(common.checkoutButtonField, PayTheoryCheckoutButton);