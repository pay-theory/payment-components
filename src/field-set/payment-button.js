/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/*global navigator*/
import common from '../common'
import * as valid from './validation'

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
    if (['new', 'old'].includes(stage)) {
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

    // Validate the input parameters
    const paymentParams = common.parseInputParams(paymentDetails)
    let {amount, payorInfo, payTheoryData, metadata = {}, feeMode, confirmation = false} = paymentParams
    let removeErrorListener = () => {}
    if (onError) removeErrorListener = common.errorObserver(onError)
    if (!valid.validTransactionParams(amount, payorInfo, payTheoryData, metadata, feeMode, confirmation))  {
        removeErrorListener()
        return false
    }
    removeErrorListener()

    // Fetch the PT Token
    let ptToken = await common.fetchPtToken(apiKey)

    window.addEventListener("beforeunload", () => {
        common.removeReady()
        common.removeSession()
    })

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

        // Set checkout window to button element properties
        const buttonElement = document.getElementById(common.checkoutButtonField)
        buttonElement.checkoutWindow = hostedCheckout

        // Create the overlay and add the properties it needs before showing it
        const overlayElement = document.createElement(common.payTheoryOverlay)
        overlayElement.setAttribute('id', common.payTheoryOverlay)
        overlayElement.onCancel = () => {
            hostedCheckout.close()
            overlayElement.remove()
            buttonElement.checkoutWindow = null
            if (onCancel) {
                onCancel()
            }
        }
        overlayElement.onFocus = () => {
            hostedCheckout.focus()
        }
        document.body.appendChild(overlayElement)

        //Add the token to the button component so that it can be used to open the button iframe
        const json = JSON.stringify({origin: ptToken.origin})
        const encodedJson = window.btoa(json)
        overlayElement.token = encodeURI(encodedJson)
    }

    // Adding logic to onCancel to handle hiding the overlay
    const onCancelWrapper = () => {
        if (onCancel) {
            onCancel()
        }
        // Close the overlay
        const overlay = document.getElementById(common.payTheoryOverlay)
        overlay.remove()

        // Close the hosted checkout page
        const buttonElement = document.getElementById(common.checkoutButtonField)
        buttonElement?.checkoutWindow?.close()
    }


    // Create the button element and add the listeners
    const tagFrame = document.createElement(common.checkoutButtonField)
    tagFrame.setAttribute('id', `${common.checkoutButtonField}-wrapper`)
    tagFrame.onCancel = onCancelWrapper
    tagFrame.onClick = onClickWrapper
    tagFrame.onReady = onReadyWrapper
    if (onError) tagFrame.onError = onError
    if (onSuccess) tagFrame.onSuccess = onSuccess

    // Append the button div to the wrapper div
    const buttonDiv = document.getElementById(common.checkoutButtonField)
    buttonDiv.appendChild(tagFrame)

    if (!ptToken['pt-token']) {
        return common.handleError(`NO_TOKEN: No pt-token found`)
    }

    //Add the token to the button component so that it can be used to open the button iframe
    const json = JSON.stringify({token: ptToken['pt-token'], origin: ptToken.origin, style, paymentDetails})
    const encodedJson = window.btoa(json)
    tagFrame.token = encodeURI(encodedJson)
}