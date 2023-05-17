/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/*global navigator*/
import common from '../common'
import * as valid from './validation'
import PayTheoryCheckoutQR from "../components/pay-theory-checkout-qr"
import {PayTheoryQRInput} from "../common/pay_theory_types";
import {ModifiedCheckoutDetails} from "../common/format";

export default async(inputParams: PayTheoryQRInput) => {
    const {
        apiKey,
        size=128,
        checkoutDetails,
        onReady,
        onError,
        onSuccess
    } = inputParams

    // const keyParts = apiKey.split("-")
    // let environment = keyParts[0]
    // let stage = keyParts[1]
    // let partnerMode = ""
    // if (['new', 'old'].includes(stage)) {
    //     partnerMode = stage
    //     stage = keyParts[2]
    // }
    //
    // common.removeAll(true)
    // let partner_environment
    // if (partnerMode === "") {
    //     partner_environment = `${environment}`
    // } else {
    //     partner_environment = `${environment}-${partnerMode}`
    // }
    // common.setEnvironment(partner_environment)
    // common.setStage(stage)

    // Validate the input parameters
    const paymentParams = common.parseInputParams(checkoutDetails) as ModifiedCheckoutDetails
    let {paymentName, callToAction, acceptedPaymentMethods} = paymentParams
    let removeErrorListener = () => {}
    let removeHostedErrorListener = () => {}
    // Putting error listener on the window and hosted button so that it can catch errors while it readies the session
    if (onError) {
        removeErrorListener = common.errorObserver(onError)
        removeHostedErrorListener = common.handleHostedFieldMessage(common.socketErrorTypeMessage, message => {
            onError(message.error)
        })
    }
    if (!valid.validTransactionParams(paymentParams) ||
        !valid.validateHostedCheckoutParams(callToAction, acceptedPaymentMethods, paymentName) ||
        !valid.validQRSize(size)) {
        return false
    }

    const finalSize = size < 128 ? 128 : size > 300 ? 300 : size

    // Fetch the PT Token
    let ptToken = await common.fetchPtToken(apiKey)

    // Adding logic to onReady to receive the session data for redirecting to the hosted checkout page
    const onReadyWrapper = () => {
        // Remove the error listener because we added it to the button iFrame and do not want it to be called twice
        removeErrorListener()
        removeHostedErrorListener()
        if (onReady) {
            onReady(true)
        }
    }

    // Create the button element and add the listeners
    const tagFrame = document.createElement(common.checkoutQRField) as PayTheoryCheckoutQR
    tagFrame.setAttribute('id', `${common.checkoutQRField}-wrapper`)
    tagFrame.size = finalSize
    tagFrame.onReady = onReadyWrapper
    if (onSuccess) tagFrame.onSuccess = (message: any) => onSuccess(message.data)
    if (onError) tagFrame.onError = onError
    // Append the button div to the wrapper div
    const qrDiv = document.getElementById(common.checkoutQRField)
    qrDiv.appendChild(tagFrame)

    if (!ptToken || !ptToken['pt-token']) {
        return common.handleError(`NO_TOKEN: No pt-token found`)
    }

    //Add the token to the button component so that it can be used to open the button iframe
    const json = JSON.stringify({token: ptToken['pt-token'], origin: ptToken.origin, size: finalSize, checkoutDetails})
    const encodedJson = window.btoa(json)
    tagFrame.token = encodeURI(encodedJson)
}