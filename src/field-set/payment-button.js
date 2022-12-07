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
        const hostedCheckoutUrl = `${common.hostedCheckoutEndpoint()}/hosted?sessionId=${common.getSession()}`
        let hostedCheckout = PopupCenter(hostedCheckoutUrl, "PayTheory Checkout", 700, 1000)
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