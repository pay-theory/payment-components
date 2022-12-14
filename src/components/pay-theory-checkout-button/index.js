/* global HTMLElement */
import common from "../../common";
import {checkoutButtonField} from "../../common/data";

class PayTheoryCheckoutButton extends HTMLElement {
    constructor() {
        super();
        this._onCancel = () => {}
        this._onReady = () => {}
        this._onClick = () => {}
        this._onError = () => {}
        this._onSuccess = () => {}
        this._onBarcode = () => {}
    }

    defineButton() {
        // Creating the iFrame for the Button
        const buttonFrame = document.createElement('iframe')
        buttonFrame.setAttribute('src', `${common.hostedFieldsEndpoint()}/checkout_button?token=${this._token}`)
        buttonFrame.setAttribute('frameBorder', '0')
        buttonFrame.setAttribute('name', common.checkoutButtonField)
        buttonFrame.setAttribute('id', `${common.checkoutButtonField}-iframe`)
        this.append(buttonFrame)
    }

    connectedCallback() {
        super.connectedCallback && super.connectedCallback();

        // Creating the listeners from the hosted checkout page
        this._clearCancelListener = common.handleCheckoutMessage(common.checkoutCancelTypeMessage, this._onCancel)
        this._clearErrorListener = common.handleCheckoutMessage(common.checkoutErrorTypeMessage, this._onError)
        this._clearSuccessListener = common.handleCheckoutMessage(common.checkoutCompleteTypeMessage, this._onSuccess)
        this._clearBarcodeReceivedListener = common.handleCheckoutMessage(common.checkoutBarcodeReceivedTypeMessage, message => {
            const data = JSON.stringify(message.data)
            common.setButtonBarcode(data)
        })

        // Creating the listeners from the hosted button page
        this._clearReadyListener = common.handleHostedFieldMessage(common.buttonReadyTypeMessage, this._onReady)
        this._clearClickListener = common.handleHostedFieldMessage(common.buttonClickTypeMessage, this._onClick)
    }

    disconnectedCallback() {
        super.disconnectedCallback && super.disconnectedCallback();
        this._clearCancelListener()
        this._clearErrorListener()
        this._clearSuccessListener()
        this._clearReadyListener()
        this._clearClickListener()
        this._clearBarcodeReceivedListener()
        this._clearBarcodeCompleteListener()
        common.removeButtonSuccess()
    }

    // Only want to allow event listeners to be set from outside the class
    // If they have been set before there should be a clear listener function so we want to clear it and reset the listener
    set onCancel(cancelFunc) {
        this._onCancel = cancelFunc
        if(this._clearCancelListener) {
            this._clearCancelListener()
            this._clearCancelListener = common.handleCheckoutMessage(common.checkoutCancelTypeMessage, this._onCancel)
        }
    }

    set onReady(readyFunc) {
        this._onReady = readyFunc
        if(this._clearReadyListener) {
            this._clearReadyListener()
            this._clearReadyListener = common.handleHostedFieldMessage(common.hostedReadyTypeMessage, this._onReady)
        }
    }

    set onClick(clickFunc) {
        this._onClick = clickFunc
        if(this._clearClickListener) {
            this._clearClickListener()
            this._clearClickListener = common.handleHostedFieldMessage(common.buttonClickTypeMessage, this._onClick)
        }
    }

    set onError(errorFunc) {
        this._onError = errorFunc
        if(this._clearErrorListener) {
            this._clearErrorListener()
            this._clearErrorListener = common.handleCheckoutMessage(common.checkoutErrorTypeMessage, this._onError)
        }
    }

    set onSuccess(successFunc) {
        this._onSuccess = successFunc
        if(this._clearSuccessListener) {
            this._clearSuccessListener()
            this._clearSuccessListener = common.handleCheckoutMessage(common.checkoutCompleteTypeMessage, this._onSuccess)
        }
    }

    set token(urlToken) {
        this._token = urlToken
        this.defineButton()
    }

    set checkoutWindow(window) {
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