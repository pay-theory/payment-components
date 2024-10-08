/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import common from '../common';
import * as valid from './validation';
import {
  PayTheoryButtonInput,
  SuccessfulTransactionObject,
  ErrorResponse,
  CashBarcodeObject,
} from '../common/pay_theory_types';
import { ModifiedCheckoutDetails } from '../common/format';
import PayTheoryCheckoutButton from '../components/pay-theory-checkout-button';
import PayTheoryOverlay from '../components/pay-theory-overlay';

const PopupCenter = (url: string, title: string, w: number, h: number) => {
  // Fixes dual-screen position                         Most browsers      Firefox
  // @ts-expect-error ignore screen error for firefox
  const dualScreenLeft: number = window.screenLeft ?? screen.left;
  // @ts-expect-error ignore screen error for firefox
  const dualScreenTop: number = window.screenTop ?? screen.top;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width;
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height;

  const left = width / 2 - w / 2 + dualScreenLeft;
  const top = height / 2 - h / 2 + dualScreenTop;
  return window.open(
    url,
    title,
    'toolbar=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes, width=' +
      w +
      ', height=' +
      h +
      ', top=' +
      top +
      ', left=' +
      left,
  );
};

const getCheckoutButton = (): PayTheoryCheckoutButton | undefined => {
  const result = document.getElementById(common.checkoutButtonField);
  if (result) {
    return result as PayTheoryCheckoutButton;
  } else {
    return undefined;
  }
};

const getOverlay = (): PayTheoryOverlay | undefined => {
  const result = document.getElementById(common.payTheoryOverlay);
  if (result) {
    return result as PayTheoryOverlay;
  } else {
    return undefined;
  }
};

export default async (inputParams: PayTheoryButtonInput) => {
  const {
    apiKey,
    style,
    checkoutDetails,
    onReady,
    onClick,
    onError,
    onCancel,
    onSuccess,
    onBarcode,
  } = inputParams;

  // Validate the input parameters
  const modifiedCheckoutDetails = common.parseInputParams(
    checkoutDetails,
  ) as ModifiedCheckoutDetails;
  modifiedCheckoutDetails.feeMode = modifiedCheckoutDetails.feeMode
    ? modifiedCheckoutDetails.feeMode
    : common.defaultFeeMode;
  const { paymentName, callToAction, acceptedPaymentMethods } = modifiedCheckoutDetails;
  let removeErrorListener = Function.prototype;
  let removeHostedErrorListener = Function.prototype;
  // Putting error listener on the window and hosted button so that it can catch errors while it readies the session
  if (onError) {
    removeErrorListener = common.errorObserver(onError);
    removeHostedErrorListener = common.handleHostedFieldMessage(
      common.socketErrorTypeMessage,
      (message: ErrorResponse) => {
        onError(message.error);
      },
    );
  }

  // Validate the input parameters
  let error = valid.validTransactionParams(modifiedCheckoutDetails);
  if (error) return false;
  error = valid.validateHostedCheckoutParams(callToAction, acceptedPaymentMethods, paymentName);
  if (error) return false;

  // eslint-disable-next-line scanjs-rules/property_crypto
  const sessionId = self.crypto.randomUUID();
  // Fetch the PT Token
  const ptToken = await common.fetchPtToken(apiKey, sessionId);

  // Adding logic to onReady to receive the session data for redirecting to the hosted checkout page
  const onReadyWrapper = (data: { sessionId?: string }) => {
    // Remove the error listener because we added it to the button iFrame and do not want it to be called twice
    removeErrorListener();
    removeHostedErrorListener();
    if (data.sessionId) {
      const buttonElement = getCheckoutButton();
      buttonElement.session = data.sessionId;
    }

    if (onReady) {
      onReady(true);
    }
  };

  const cancelOrBarcode = () => {
    // Check to see if a barcode response was sent back to tell which callback to call
    const buttonElement = getCheckoutButton();
    if (buttonElement?.buttonBarcode) {
      if (onBarcode) onBarcode(JSON.parse(buttonElement.buttonBarcode) as CashBarcodeObject);
    } else {
      if (onCancel) onCancel();
    }
  };

  // Adding logic to onClick to handle opening the page and showing the overlay
  const onClickWrapper = () => {
    // Remove on success if button is clicked again so that the cancel can clear the overlay
    const buttonElement = getCheckoutButton();

    // Open the hosted checkout page
    const hostedCheckoutUrl = `${common.hostedCheckoutEndpoint}/hosted?sessionId=${buttonElement.session}`;
    const hostedCheckout = PopupCenter(hostedCheckoutUrl, 'PayTheory Checkout', 700, 1000);
    hostedCheckout.focus();

    // Set checkout window to button element properties
    buttonElement.checkoutWindow = hostedCheckout;
    // eslint-disable-next-line scanjs-rules/call_setInterval
    buttonElement.closeInterval = setInterval(() => {
      if (hostedCheckout.closed) {
        // Clear the interval and remove the overlay
        clearInterval(buttonElement.closeInterval);
        buttonElement.closeInterval = null;
        closeOverlay();
        // Call to either trigger cancel or barcode callback
        cancelOrBarcode();
      }
    }, 500);

    // Create the overlay and add the properties it needs before showing it
    const overlayElement = document.createElement(common.payTheoryOverlay) as PayTheoryOverlay;
    overlayElement.setAttribute('id', common.payTheoryOverlay);
    overlayElement.onCancel = () => {
      hostedCheckout.close();
      overlayElement.remove();
      buttonElement.checkoutWindow = null;
      clearInterval(buttonElement.closeInterval);
      buttonElement.closeInterval = null;
      // Call to either trigger cancel or barcode callback
      cancelOrBarcode();
    };
    overlayElement.onFocus = () => {
      hostedCheckout.focus();
    };
    document.body.appendChild(overlayElement);

    //Add the token to the button component so that it can be used to open the button iframe
    const json = JSON.stringify({ origin: ptToken ? ptToken.origin : window.location.origin });
    const encodedJson = window.btoa(json);
    overlayElement.token = encodeURI(encodedJson);

    if (onClick) {
      onClick();
    }
  };

  const closeOverlay = () => {
    // Close the overlay
    const overlay = getOverlay();
    overlay?.remove();
  };

  const closeCheckout = () => {
    // Close the hosted checkout page
    const buttonElement = getCheckoutButton();
    const checkoutWindow = buttonElement.checkoutWindow;
    checkoutWindow?.close();
    buttonElement.checkoutWindow = null;
  };

  // Add logic to listener to handle hiding the overlay and closing the popup
  const onSuccessWrapper = (message: { data: SuccessfulTransactionObject }) => {
    // Clear the close check interval
    const buttonElement = getCheckoutButton();
    clearInterval(buttonElement.closeInterval);
    buttonElement.closeInterval = null;
    closeCheckout();
    closeOverlay();
    if (onSuccess) {
      onSuccess(message.data);
    }
  };

  // Create the button element and add the listeners
  const tagFrame = document.createElement(common.checkoutButtonField) as PayTheoryCheckoutButton;
  tagFrame.setAttribute('id', `${common.checkoutButtonField}-wrapper`);
  tagFrame.onClick = onClickWrapper;
  tagFrame.onReady = onReadyWrapper;
  tagFrame.onSuccess = onSuccessWrapper;
  if (onError) tagFrame.onError = onError;
  // Append the button div to the wrapper div
  const buttonDiv = document.getElementById(common.checkoutButtonField);
  buttonDiv.appendChild(tagFrame);

  if (!ptToken || !ptToken['pt-token']) {
    return common.handleError(`NO_TOKEN: No pt-token found`);
  }

  //Add the token to the button component so that it can be used to open the button iframe
  const json = JSON.stringify({
    token: ptToken['pt-token'],
    origin: ptToken.origin,
    style,
    checkoutDetails: modifiedCheckoutDetails,
  });
  const encodedJson = window.btoa(json);
  tagFrame.token = encodeURI(encodedJson);
};
