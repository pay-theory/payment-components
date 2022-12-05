/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/*global navigator*/
import common from '../common'
import * as valid from './validation'
import * as handler from './handler'
import * as message from "../common/message";

export default async(inputParams) => {
    const {
        apiKey,
        style,
        paymentDetails,
        onReady,
        onClick,
        onError,
        onCancel,
        onSuccess
    } = inputParams

    const keyParts = apiKey.split("-")
    let environment = keyParts[0]
    let stage = keyParts[1]
    let partnerMode = ""
    if (['new','old'].includes(stage)) {
        partnerMode = stage
        stage = keyParts[2]
    }

    common.removeAll(true)
    let partner_environment
    if (partnerMode === "") {
        partner_environment = `${environment}`
    } else {
        partner_environment = `${environment}-${partnerMode}`
    }
    common.setEnvironment(partner_environment)
    common.setStage(stage)

    let ptToken = await common.fetchPtToken(apiKey)

    window.addEventListener("beforeunload", () => { common.removeReady() })

    // Adding logic to onReady to receive the session data for redirecting to the hosted checkout page
    const onReadyWrapper = (data) => {
        if (onReady) {
            onReady()
        }
        if (data && data?.sessionId) {
            common.setSession(data.sessionId)
        }
    }

    // Adding logic to onClick to handle opening the page and showing the overlay
    const onClickWrapper = () => {
        if (onClick) {
            onClick()
        }

        // Open the hosted checkout page
        const hostedCheckoutUrl = `${common.hostedCheckoutEndpoint()}?sessionId=${common.getSession()}`
        let hostedCheckout = window.open(hostedCheckoutUrl, '_blank')
        hostedCheckout.focus()

        // TODO - This is where we need to set the function to close the window on the overlay

        // Open the overlay
        const overlayElement = document.createElement(common.payTheoryOverlay)
        overlayElement.setAttribute('id', common.payTheoryOverlay)
        overlayElement.onCancel = () => {
            hostedCheckout.close()
            overlayElement.remove()
        }
        overlayElement.onFocus = () => {
            hostedCheckout.focus()
        }
        document.body.appendChild(overlayElement)
    }

    // Adding listeners for the hosted button messaging
    const removeClick = common.handleHostedFieldMessage(common.buttonClickTypeMessage, onClickWrapper)
    const removeReady = common.handleHostedFieldMessage(common.readyTypeMessage, onReadyWrapper)

    // Adding logic to onCancel to handle hiding the overlay
    const onCancelWrapper = () => {
        if (onCancel) {
            onCancel()
        }
        // Close the overlay
        const overlay = document.getElementById('pay-theory-overlay')
        overlay.style.display = 'none'
    }

    // Add listeners for the hosted checkout page
    const removeError = onError ? common.handleCheckoutMessage(common.checkoutErrorTypeMessage, onError) : () => {}
    const removeSuccess = onSuccess ? common.handleCheckoutMessage(common.checkoutCompleteTypeMessage, onSuccess) : () => {}
    const removeCancel = common.handleCheckoutMessage(common.checkoutCancelTypeMessage, onCancelWrapper)


    // Add the button iFrame to the page
    const buttonDiv = document.getElementById('pay-theory-checkout-button')
    const buttonFrame = common.addFrame(buttonDiv, 'pay-theory-checkout-button-tag-frame')

    if(!ptToken['pt-token']) {
        return common.handleError(`NO_TOKEN: No pt-token found`)
    }

    //Add the token to the button component so that it can be used to open the button iframe
    const json = JSON.stringify({ token: ptToken['pt-token'], origin: ptToken.origin, style, paymentDetails})
    const encodedJson = window.btoa(json)
    buttonFrame.token = encodeURI(encodedJson)

    return {
        removeClick,
        removeReady,
        removeError,
        removeSuccess,
        removeCancel,
        clearListeners: () => {
            removeClick()
            removeReady()
            removeError()
            removeSuccess()
            removeCancel()
        }
    }
}