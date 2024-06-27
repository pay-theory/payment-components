/* eslint-disable no-unused-vars */
/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import common from '../common';
import * as valid from './validation';
import {
  achElementIds,
  cardElementIds,
  cashElementIds,
  MERCHANT_FEE,
  SERVICE_FEE,
} from '../common/data';
import PayTheoryHostedField from '../components/pay-theory-hosted-field';
import { processedElement } from '../common/dom';
import PayTheoryHostedFieldTransactional from '../components/pay-theory-hosted-field-transactional';
import * as handler from './handler';
import {
  ErrorResponse,
  ErrorType,
  PayTheoryPaymentFieldsInput,
  PlaceholderObject,
  ReadyResponse,
  ResponseMessageTypes,
  StyleObject,
} from '../common/pay_theory_types';

interface ProcessedObjectValue<T extends cashElementIds | cardElementIds | achElementIds> {
  elements: {
    transacting: processedElement<T, PayTheoryHostedFieldTransactional>[];
    siblings: processedElement<T, PayTheoryHostedField>[];
  };
  errorCheck: (
    allElements: (PayTheoryHostedField | PayTheoryHostedFieldTransactional)[],
    transacting: PayTheoryHostedFieldTransactional[],
  ) => string | false;
}

interface ProcessedObject {
  card: ProcessedObjectValue<cardElementIds>;
  ach: ProcessedObjectValue<achElementIds>;
  cash: ProcessedObjectValue<cashElementIds>;
}

const mountProcessedElements = (props: {
  processed: ProcessedObject;
  apiKey: string;
  styles: StyleObject;
  placeholders: PlaceholderObject;
  session: string | undefined;
  metadata: Record<string | number, string | number | boolean>;
  removeEventListeners: () => void;
  feeMode: typeof MERCHANT_FEE | typeof SERVICE_FEE | undefined;
  amount: number | undefined;
  port: MessagePort;
}): ErrorResponse | null => {
  const {
    processed,
    apiKey,
    styles,
    placeholders,
    session,
    metadata,
    removeEventListeners,
    feeMode,
    amount,
  } = props;
  for (const value of Object.values(processed)) {
    const typedValue = value as ProcessedObjectValue<
      cashElementIds | cardElementIds | achElementIds
    >;
    const transactingElements = typedValue.elements.transacting.map(element => element.frame);
    const siblingsElements = typedValue.elements.siblings.map(element => element.frame);
    const allElements = [...transactingElements, ...siblingsElements];
    if (allElements.length > 0) {
      const error = typedValue.errorCheck(allElements, transactingElements);
      if (error) {
        return common.handleTypedError(ErrorType.FIELD_ERROR, error);
      }
      typedValue.elements.siblings.forEach(sibling => {
        const container = document.getElementById(String(sibling.containerId));
        sibling.frame.styles = styles;
        sibling.frame.placeholders = placeholders;
        sibling.frame.session = session;
        if (container) {
          container.appendChild(sibling.frame);
        }
      });
      typedValue.elements.transacting.forEach(element => {
        const container = document.getElementById(String(element.containerId));
        element.frame.apiKey = apiKey;
        element.frame.styles = styles;
        element.frame.placeholders = placeholders;
        element.frame.metadata = metadata;
        element.frame.removeEventListeners = removeEventListeners;
        element.frame.feeMode = feeMode;
        element.frame.amount = amount;
        element.frame.session = session;
        const processedElementTypes = typedValue.elements.siblings.map(sibling => sibling.type);
        const transactingElementType = typedValue.elements.transacting.map(
          transacting => transacting.type,
        );
        element.frame.processedElements = [...processedElementTypes, ...transactingElementType];
        element.frame.readyPort = props.port;
        if (container) {
          container.appendChild(element.frame);
        }
      });
    }
  }
  return null;
};

const initializeFields = (
  props: PayTheoryPaymentFieldsInput,
  port: MessagePort,
): ErrorResponse | null => {
  const {
    apiKey,
    styles = common.defaultStyles,
    metadata = {},
    placeholders = {},
    elementIds = common.defaultElementIds,
    session,
    feeMode,
    amount,
  } = props;
  valid.checkInitialParams(apiKey, feeMode, metadata, styles, amount);
  // Map the elementIds to objects that can be passed into the processElements function
  const achElements: achElementIds = {
    'account-number': elementIds['account-number'],
    'account-name': elementIds['ach-name'],
    'routing-number': elementIds['routing-number'],
    'account-type': elementIds['account-type'],
  };

  const cardElements: cardElementIds = {
    'credit-card': elementIds['credit-card'],
    'card-number': elementIds.number,
    'card-exp': elementIds.exp,
    'card-cvv': elementIds.cvv,
    'card-name': elementIds['account-name'],
    'billing-line1': elementIds['address-1'],
    'billing-line2': elementIds['address-2'],
    'billing-city': elementIds.city,
    'billing-state': elementIds.state,
    'billing-zip': elementIds.zip,
  };

  const cashElements: cashElementIds = {
    'cash-name': elementIds['cash-name'],
    'cash-contact': elementIds['cash-contact'],
  };

  const removeRelay = common.handleHostedFieldMessage(
    common.relayTypeMessage,
    handler.relayHandler,
  );
  const removeState = common.handleHostedFieldMessage(
    common.hostedStateTypeMessage,
    handler.stateUpdater,
  );
  const removeHostedError = common.handleHostedFieldMessage(
    common.socketErrorTypeMessage,
    handler.hostedErrorHandler,
  );

  const removeEventListeners = () => {
    removeState();
    removeHostedError();
    removeRelay();
  };

  // Creates the web component elements, so they can be added to the dom
  const cardProcessed = common.processElements(cardElements, common.cardFieldTypes);
  const achProcessed = common.processElements(achElements, common.achFieldTypes);
  const cashProcessed = common.processElements(cashElements, common.cashFieldTypes);

  // Throw an error if there are no elements to mount
  if (
    cardProcessed.transacting.length === 0 &&
    cardProcessed.siblings.length === 0 &&
    cashProcessed.transacting.length === 0 &&
    cashProcessed.siblings.length === 0 &&
    achProcessed.transacting.length === 0 &&
    achProcessed.siblings.length === 0
  ) {
    return common.handleTypedError(
      ErrorType.NO_FIELDS,
      'There are no PayTheory fields on the DOM to mount',
    );
  }

  const processed: ProcessedObject = {
    card: {
      elements: cardProcessed,
      errorCheck: valid.findCardError,
    },
    ach: {
      elements: achProcessed,
      errorCheck: valid.findAchError,
    },
    cash: {
      elements: cashProcessed,
      errorCheck: valid.findCashError,
    },
  };
  // Mount the elements to the DOM
  return mountProcessedElements({
    processed,
    apiKey,
    styles,
    placeholders,
    session,
    metadata,
    removeEventListeners,
    feeMode,
    amount,
    port,
  });
};

const payTheoryFields = async (inputParams: PayTheoryPaymentFieldsInput) =>
  new Promise<ReadyResponse | ErrorResponse>(resolve => {
    // Opening a new message channel, so we can await the response from the hosted field
    const channel = new MessageChannel();

    channel.port1.onmessage = () => {
      channel.port1.close();
      resolve({
        type: ResponseMessageTypes.READY,
        body: true,
      });
    };

    if (document.readyState === 'complete') {
      const result = initializeFields(inputParams, channel.port2);
      if (result) resolve(result);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        const result = initializeFields(inputParams, channel.port2);
        if (result) resolve(result);
      });
    }
  });

export default payTheoryFields;
