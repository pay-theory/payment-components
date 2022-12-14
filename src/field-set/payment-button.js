/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/*global navigator*/
import common from '../common'
import * as valid from './validation'

const PopupCenter = (url, title, w, h) => {
    // Fixes dual-screen position                         Most browsers      Firefox
    const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const left = ((width / 2) - (w / 2)) + dualScreenLeft;
    const top = ((height / 2) - (h / 2)) + dualScreenTop;
    return window.open(url, title, 'toolbar=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
}

export default async(inputParams) => {
    const {
        apiKey,
        style,
        checkoutDetails,
        onReady,
        onClick,
        onError,
        onCancel,
        onSuccess,
        onBarcode
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
    const paymentParams = common.parseInputParams(checkoutDetails)
    let {amount, payorInfo = {}, payTheoryData, metadata = {}, feeMode, paymentName, callToAction, acceptedPaymentMethods } = paymentParams
    let removeErrorListener = () => {}
    let removeHostedErrorListener = () => {}
    // Putting error listener on the window and hosted button so that it can catch errors while it readies the session
    if (onError) {
        removeErrorListener = common.errorObserver(onError)
        removeHostedErrorListener = common.handleHostedFieldMessage(common.socketErrorTypeMessage, message => {
            onError(message.error)
        })
    }
    if (!valid.validTransactionParams(amount, payorInfo, payTheoryData, metadata, feeMode) ||
        !valid.validateHostedCheckoutParams(callToAction, acceptedPaymentMethods, paymentName)) {
        return false
    }

    // Fetch the PT Token
    let ptToken = await common.fetchPtToken(apiKey)

    window.addEventListener("beforeunload", () => {
        common.removeReady()
        common.removeSession()
        common.removeButtonBarcode()
        common.removeButtonSuccess()
    })

    // Adding logic to onReady to receive the session data for redirecting to the hosted checkout page
    const onReadyWrapper = (data) => {
        // Remove the error listener because we added it to the button iFrame and do not want it to be called twice
        removeErrorListener()
        removeHostedErrorListener()
        if (data && data?.sessionId) {
            common.setSession(data.sessionId)
        }

        if (onReady) {
            onReady()
        }
    }

    const cancelOrBarcode = () => {
        // Check to see if a barcode response was sent back to tell which callback to call
        const barcodeReceived = common.getButtonBarcode()
        if(barcodeReceived) {
            if(onBarcode) onBarcode(JSON.parse(barcodeReceived))
        } else {
            if(onCancel) onCancel()
        }
    }

    // Adding logic to onClick to handle opening the page and showing the overlay
    const onClickWrapper = () => {
        // Remove on success if button is clicked again so that the cancel can clear the overlay
        common.removeButtonSuccess()

        // Open the hosted checkout page
        const hostedCheckoutUrl = `${common.hostedCheckoutEndpoint()}/hosted?sessionId=${common.getSession()}`
        let hostedCheckout = PopupCenter(hostedCheckoutUrl, "PayTheory Checkout", 700, 1000)
        hostedCheckout.focus()

        // Set checkout window to button element properties
        const buttonElement = document.getElementById(common.checkoutButtonField)
        buttonElement.checkoutWindow = hostedCheckout
        buttonElement.closeInterval = setInterval(() => {
            if (hostedCheckout.closed) {
                // Clear the interval and remove the overlay
                clearInterval(buttonElement.closeInterval)
                buttonElement.closeInterval = null
                closeOverlay()
                // Call to either trigger cancel or barcode callback
                cancelOrBarcode()
            }
        }, 500)

        // Create the overlay and add the properties it needs before showing it
        const overlayElement = document.createElement(common.payTheoryOverlay)
        overlayElement.setAttribute('id', common.payTheoryOverlay)
        overlayElement.onCancel = () => {
            hostedCheckout.close()
            overlayElement.remove()
            buttonElement.checkoutWindow = null
            clearInterval(buttonElement.closeInterval)
            buttonElement.closeInterval = null
            // Call to either trigger cancel or barcode callback
            cancelOrBarcode()
        }
        overlayElement.onFocus = () => {
            hostedCheckout.focus()
        }
        document.body.appendChild(overlayElement)

        //Add the token to the button component so that it can be used to open the button iframe
        const json = JSON.stringify({origin: ptToken.origin})
        const encodedJson = window.btoa(json)
        overlayElement.token = encodeURI(encodedJson)

        if (onClick) {
            onClick()
        }
    }

    const closeOverlay = () => {
        // Close the overlay
        const overlay = document.getElementById(common.payTheoryOverlay)
        overlay?.remove()
    }

    const closeCheckout = () => {
        // Close the hosted checkout page
        const buttonElement = document.getElementById(common.checkoutButtonField)
        const checkoutWindow = buttonElement.checkoutWindow
        checkoutWindow?.close()
        buttonElement.checkoutWindow = null
    }

    // Add logic to listener to handle hiding the overlay and closing the popup
    const onSuccessWrapper = message => {
        // Clear the close check interval
        const buttonElement = document.getElementById(common.checkoutButtonField)
        clearInterval(buttonElement.closeInterval)
        buttonElement.closeInterval = null
        closeCheckout()
        closeOverlay()
        if (onSuccess) {
            onSuccess(message.data)
        }
    }

    // Create the button element and add the listeners
    const tagFrame = document.createElement(common.checkoutButtonField)
    tagFrame.setAttribute('id', `${common.checkoutButtonField}-wrapper`)
    tagFrame.onClick = onClickWrapper
    tagFrame.onReady = onReadyWrapper
    tagFrame.onSuccess = onSuccessWrapper
    if (onError) tagFrame.onError = onError
    // Append the button div to the wrapper div
    const buttonDiv = document.getElementById(common.checkoutButtonField)
    buttonDiv.appendChild(tagFrame)

    if (!ptToken['pt-token']) {
        return common.handleError(`NO_TOKEN: No pt-token found`)
    }

    //Add the token to the button component so that it can be used to open the button iframe
    const json = JSON.stringify({token: ptToken['pt-token'], origin: ptToken.origin, style, checkoutDetails})
    const encodedJson = window.btoa(json)
    tagFrame.token = encodeURI(encodedJson)
}