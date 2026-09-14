import common from '../common';
import {
  ElementTypes,
  transactingWebComponentIds,
  transactingWebComponentMap,
} from '../common/data';
import payTheoryHostedFieldTransactional, {
  IncomingFieldState,
} from '../components/pay-theory-hosted-field-transactional';

interface relayMessage {
  type: string;
  value: string | object;
  element: ElementTypes | 'card-autofill' | 'address-autofill';
}

//relays state to the hosted fields to tokenize the instrument
const verifyRelay = (fields: string[], message: relayMessage) => {
  fields.forEach(field => {
    common.postMessageToHostedField(field, message);
  });
};

const autofillHandler = (message: relayMessage) => {
  if (message.element === 'card-autofill') {
    const cardFields = ['card-name-iframe', 'card-cvv-iframe', 'card-exp-iframe'];
    verifyRelay(cardFields, message);
  } else if (message.element === 'address-autofill') {
    const addressFields = [
      'billing-line2-iframe',
      'billing-city-iframe',
      'billing-state-iframe',
      'billing-zip-iframe',
    ];
    verifyRelay(addressFields, message);
  }
};

//Relay messages from hosted fields to the transacting element for autofill and transacting
export const relayHandler = (message: relayMessage) => {
  if (message.element === 'card-autofill' || message.element === 'address-autofill') {
    autofillHandler(message);
  } else {
    const fieldType = common.isFieldType(message.element);
    if (fieldType) common.postMessageToHostedField(common.hostedFieldMap[fieldType], message);
  }
};

//Handles state messages and sets state on the web components
export const stateUpdater = (message: {
  element: ElementTypes;
  state: IncomingFieldState;
  type: string;
}) => {
  transactingWebComponentIds.forEach(id => {
    const element = document.getElementsByName(id);
    if (element.length > 0) {
      const transactingElement = element[0] as payTheoryHostedFieldTransactional;
      const state = message.state;
      transactingElement.state = {
        ...state,
        element: message.element,
      };
    }
  });
};

export const hostedErrorHandler = (message: {
  type: string;
  error: string;
  field: ElementTypes;
}) => {
  const socketErrorCode = (() => {
    if (typeof message.error !== 'string') return null;
    const trimmed = message.error.trim();

    // Common case from secure-tags-lib: `SOCKET_ERROR: ERROR_CODE: message`
    const withoutSocketPrefix = trimmed.startsWith('SOCKET_ERROR:')
      ? trimmed.slice('SOCKET_ERROR:'.length).trim()
      : trimmed;
    const directMatch = withoutSocketPrefix.match(/^([A-Z][A-Z0-9_]+):/);
    if (directMatch) return directMatch[1];

    // Defensive: tolerate nested/duplicated socket prefixes or other preambles.
    const nestedMatch = trimmed.match(/(?:^|SOCKET_ERROR:\s*)([A-Z][A-Z0-9_]+):/);
    return nestedMatch ? nestedMatch[1] : null;
  })();

  const isSessionInvalid =
    socketErrorCode === 'SESSION_EXPIRED' ||
    socketErrorCode === 'SESSION_NOT_FOUND' ||
    socketErrorCode === 'SESSION_SPENT' ||
    socketErrorCode === 'CHECKOUT_COMPLETE';

  const fieldType = common.isFieldType(message.field);
  if (fieldType) {
    const components = transactingWebComponentMap[fieldType];
    components.ids.forEach(id => {
      const element = document.getElementsByName(id);
      if (element.length > 0) {
        const transactingElement = element[0] as payTheoryHostedFieldTransactional;
        if (transactingElement.initialized) {
          transactingElement.initialized = false;
          transactingElement.resetToken().catch(() => {
            common.handleError('Error resetting token');
          });
        }

        // If the session is no longer active, set the ready state to false
        if (isSessionInvalid) transactingElement.connected = false;
      }
    });
  }

  // Do not throw an error if the error is a session expired error
  if (socketErrorCode !== 'SESSION_EXPIRED') common.handleError(message.error);
};
