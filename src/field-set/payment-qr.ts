/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import common from '../common';
import * as valid from './validation';
import PayTheoryCheckoutQR from '../components/pay-theory-checkout-qr';
import { PayTheoryQRInput, SuccessfulTransactionObject } from '../common/pay_theory_types';
import { ErrorMessage, ModifiedCheckoutDetails } from '../common/format';

export default async (inputParams: PayTheoryQRInput) => {
  const { apiKey, size = 128, checkoutDetails, onReady, onError, onSuccess } = inputParams;

  // Validate the input parameters
  const modifiedCheckoutDetails = common.parseInputParams(
    checkoutDetails,
  ) as ModifiedCheckoutDetails;
  modifiedCheckoutDetails.feeMode = modifiedCheckoutDetails.feeMode
    ? modifiedCheckoutDetails.feeMode
    : common.defaultFeeMode;
  const { paymentName, callToAction, acceptedPaymentMethods } = modifiedCheckoutDetails;
  let removeErrorListener: (() => void) | null = null;
  let removeHostedErrorListener: (() => void) | null = null;
  // Putting error listener on the window and hosted button so that it can catch errors while it readies the session
  if (onError) {
    removeErrorListener = common.errorObserver(onError);
    removeHostedErrorListener = common.handleHostedFieldMessage(
      common.socketErrorTypeMessage,
      (message: ErrorMessage) => {
        onError(message.error);
      },
    );
  }

  // Validate the input parameters
  let error = valid.validTransactionParams(modifiedCheckoutDetails);
  if (error) return false;
  error = valid.validateHostedCheckoutParams(callToAction, acceptedPaymentMethods, paymentName);
  if (error) return false;
  error = valid.validQRSize(size);
  if (error) return false;

  const finalSize = size < 128 ? 128 : size > 300 ? 300 : size;

  // eslint-disable-next-line scanjs-rules/property_crypto
  const sessionId = self.crypto.randomUUID();
  // Fetch the PT Token
  const ptToken = await common.fetchPtToken(apiKey, sessionId);

  // Adding logic to onReady to receive the session data for redirecting to the hosted checkout page
  const onReadyWrapper = () => {
    // Remove the error listener because we added it to the button iFrame and do not want it to be called twice
    if (removeErrorListener) removeErrorListener();
    if (removeHostedErrorListener) removeHostedErrorListener();
    if (onReady) {
      onReady(true);
    }
  };

  // Create the button element and add the listeners
  const tagFrame = document.createElement(common.checkoutQRField) as PayTheoryCheckoutQR;
  tagFrame.setAttribute('id', `${common.checkoutQRField}-wrapper`);
  tagFrame.size = finalSize;
  tagFrame.onReady = onReadyWrapper;
  if (onSuccess) {
    tagFrame.onSuccess = (message: MessageEvent) => {
      onSuccess(message.data as SuccessfulTransactionObject);
    };
  }
  if (onError) tagFrame.onError = onError;
  // Append the button div to the wrapper div
  const qrDiv = document.getElementById(common.checkoutQRField);
  qrDiv.appendChild(tagFrame);

  if (!ptToken || !ptToken['pt-token']) {
    return common.handleError(`NO_TOKEN: No pt-token found`);
  }

  //Add the token to the button component so that it can be used to open the button iframe
  const json = JSON.stringify({
    token: ptToken['pt-token'],
    origin: ptToken.origin,
    size: finalSize,
    checkoutDetails: modifiedCheckoutDetails,
  });
  const encodedJson = window.btoa(json);
  tagFrame.token = encodeURI(encodedJson);
};
