import { hostedCheckoutEndpoint, hostedFieldsEndpoint } from './network';
import { ElementTypes } from './data';
import {
  CashBarcodeResponse,
  ConfirmationResponse,
  ErrorResponse,
  ErrorType,
  FailedTransactionResponse,
  ResponseMessageTypes,
  SuccessfulTransactionResponse,
  TokenizedPaymentMethodResponse,
} from './pay_theory_types';

interface PayTheoryEvent extends MessageEvent {
  payTheory: boolean;
}
type validTargetFunc = (message: { type: unknown; element?: ElementTypes }) => boolean;
type handleMessageFunc = (message: unknown) => void | Promise<unknown>;

const windowListenerHandler = (
  validTarget: validTargetFunc,
  handleMessage: handleMessageFunc,
  event: PayTheoryEvent,
) => {
  // If payTheory is not set to true on the event then ignore as it is not from one of our listeners
  if (!event.payTheory) return;

  let message = event.data as string | { type: unknown; element?: ElementTypes };
  if (typeof message !== 'object') {
    try {
      // Parse the message as JSON.
      // All PT messages have either an object or a stringified object as the data
      message = JSON.parse(message) as { type: unknown; element?: ElementTypes };
    } catch (e) {
      // Do nothing
      return;
    }
  }
  if (validTarget(message)) {
    const response = handleMessage(message);
    if (response instanceof Promise) {
      response.catch((error: string) => handleError(error));
    }
  }
};

const generateWindowListener = (validTarget: validTargetFunc, handleMessage: handleMessageFunc) => {
  return (event: MessageEvent) => {
    if ([window.location.origin].includes(event.origin)) {
      const newEvent: PayTheoryEvent = event as PayTheoryEvent;
      newEvent.payTheory = true;
      windowListenerHandler(validTarget, handleMessage, newEvent);
    }
  };
};

const generateiFrameWindowListener = (
  validTarget: validTargetFunc,
  handleMessage: handleMessageFunc,
) => {
  return (event: MessageEvent) => {
    if (event.origin === hostedFieldsEndpoint) {
      const newEvent: PayTheoryEvent = event as PayTheoryEvent;
      newEvent.payTheory = true;
      windowListenerHandler(validTarget, handleMessage, newEvent);
    }
  };
};

const generateCheckoutWindowListener = (
  validTarget: validTargetFunc,
  handleMessage: handleMessageFunc,
) => {
  return (event: MessageEvent) => {
    if (event.origin === hostedCheckoutEndpoint) {
      const newEvent: PayTheoryEvent = event as PayTheoryEvent;
      newEvent.payTheory = true;
      windowListenerHandler(validTarget, handleMessage, newEvent);
    }
  };
};

export const handleMessage = (validTarget: validTargetFunc, handleMessage: handleMessageFunc) => {
  const func = generateWindowListener(validTarget, handleMessage);
  window.addEventListener('message', func);
  return () => {
    window.removeEventListener('message', func);
  };
};

export const handleHostedFieldMessage = (
  validTarget: validTargetFunc,
  handleMessage: handleMessageFunc,
) => {
  const func = generateiFrameWindowListener(validTarget, handleMessage);
  window.addEventListener('message', func);
  return () => {
    window.removeEventListener('message', func);
  };
};

export const handleCheckoutMessage = (
  validTarget: validTargetFunc,
  handleMessage: handleMessageFunc,
) => {
  const func = generateCheckoutWindowListener(validTarget, handleMessage);
  window.addEventListener('message', func);
  return () => {
    window.removeEventListener('message', func);
  };
};

export interface AsyncMessage {
  type: string;
  data?: unknown;
  async: true;
}

export const sendAsyncPostMessage = <T>(message: AsyncMessage, iframe: HTMLIFrameElement) =>
  new Promise<T>(resolve => {
    // Opening a new message channel, so we can await the response from the hosted field
    const channel = new MessageChannel();

    console.log(`[PT Debug] Sending async message to iframe: ${iframe.id}`, message);

    channel.port1.onmessage = ({ data }) => {
      console.log(`[PT Debug] Received response via MessageChannel for ${iframe.id}:`, data);
      channel.port1.close();
      resolve(data);
    };
    iframe.contentWindow.postMessage(message, hostedFieldsEndpoint, [channel.port2]);
  });

export const errorTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt:error';
export const readyTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pay-theory:ready';
export const stateTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pay-theory:state';
export const validTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pay-theory:valid';

export const hostedStateTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-static:state';
export const relayTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-static:relay';

//Sends message to the tokenize observer
export const confirmString = 'pt:confirm';
export const confirmTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === confirmString;
//Sends message to the transacted observer
export const completeString = 'pt:complete';
export const completeTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === completeString;
//Sends message to the capture observer
export const captureString = 'pt:capture';
export const confirmationCompleteTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === captureString;
//Sends message to the cash observer
export const cashString = 'pt:cash';
export const cashTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === cashString;

//passes socket error from the hosted fields to SDK
export const socketErrorTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-static:error';

//Message sent from hosted-fields with data when a card present device is activated or response is received from processor
export const cardPresentTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-static:card-present';

// Message sent from hosted-fields when a hosted button is clicked
export const buttonClickTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-static:button-click';

// Message sent from hosted-fields when a hosted button is clicked
export const buttonReadyTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-static:button-ready';

// Message sent from the checkout page when there is an error
export const checkoutErrorTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-checkout:error';

// Message sent from the checkout page when the payment is complete
export const checkoutCompleteTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-checkout:complete';

// Message sent from the checkout page when the barcode is received
export const checkoutBarcodeReceivedTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-checkout:barcode-received';

// Message from the overlay when the user clicks the close button
export const overlayCancelTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-overlay:cancel';

// Message from the overlay when the user clicks the relaunch button
export const overlayRelaunchTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-overlay:relaunch';

// Message from the qr code when it is ready
export const qrCodeReadyTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-static:qr-ready';

// Message from the qr code when it is completes a successful transaction
export const qrCodeCompleteTypeMessage = (message: { type: unknown }) =>
  typeof message.type === 'string' && message.type === 'pt-static:qr-checkout-success';

export const postMessageToHostedField = (id: string, message: object, channel?: MessagePort) => {
  const elements = document.getElementsByName(id);
  if (elements.length) {
    const element = elements[0] as HTMLIFrameElement;
    console.log(`[PT Debug] Posting message to hosted field ${id}:`, message);
    if (channel) {
      element.contentWindow.postMessage(message, hostedFieldsEndpoint, [channel]);
    } else {
      element.contentWindow.postMessage(message, hostedFieldsEndpoint);
    }
  } else {
    console.error(`[PT Debug] Hosted Field not found: ${id}`);
  }
};

export const handleError = (error: string): ErrorResponse => {
  window.postMessage(
    {
      type: 'pt:error',
      error,
    },
    window.location.origin,
  );
  return {
    type: ResponseMessageTypes.ERROR,
    error,
  };
};

export const handleTypedError = (type: ErrorType, error: string): ErrorResponse => {
  const errorString = `${type}: ${error}`;
  return handleError(errorString);
};

// This function is used for backwards compatibility with the observer functions that were used before the SDK was set up with async functions using MessageChannel
export const sendObserverMessage = (
  message:
    | SuccessfulTransactionResponse
    | FailedTransactionResponse
    | ErrorResponse
    | CashBarcodeResponse
    | TokenizedPaymentMethodResponse
    | ConfirmationResponse,
  confirmationResponse = false,
) => {
  switch (message.type) {
    case ResponseMessageTypes.SUCCESS:
    case ResponseMessageTypes.TOKENIZED:
    case ResponseMessageTypes.FAILED: {
      const messageType = confirmationResponse ? captureString : completeString;
      window.postMessage(
        {
          type: messageType,
          body: message.body,
        },
        window.location.origin,
      );
      break;
    }
    case ResponseMessageTypes.CASH: {
      window.postMessage(
        {
          type: cashString,
          body: message.body,
        },
        window.location.origin,
      );
      break;
    }
    case ResponseMessageTypes.CONFIRMATION: {
      window.postMessage(
        {
          type: confirmString,
          body: message.body,
        },
        window.location.origin,
      );
      break;
    }
    case ResponseMessageTypes.ERROR: {
      // Do nothing. Error message should have already been sent
      break;
    }
    default:
      // Do nothing
      break;
  }
};
