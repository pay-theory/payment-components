// eslint-disable-next-line @typescript-eslint/no-unused-vars
/* global navigator */
import { postMessageToHostedField } from './message';
import PayTheoryHostedFieldTransactional from '../components/pay-theory-hosted-field-transactional';
import { BillingInfo } from './pay_theory_types';
import { ErrorMessage, FieldsReadyMessage } from './format';
import { ACH_IFRAME, CARD_IFRAME, CASH_IFRAME, ElementTypes } from './data';

const sessionKey = self.crypto.randomUUID();

export const getData = async (url: string, apiKey: string) => {
  const options: RequestInit = {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'x-api-key': apiKey,
      'x-session-key': sessionKey,
    },
  };
  /* global fetch */
  const response = await fetch(url, options);
  return await response.json();
};

export const PARTNER = process.env.ENV;
export const STAGE = process.env.STAGE;
const TARGET_MODE = process.env.TARGET_MODE;
const ENVIRONMENT = `${PARTNER}${TARGET_MODE}`;

export const transactionEndpoint = `https://${ENVIRONMENT}.${STAGE}.com/pt-token-service/`;

export const hostedFieldsEndpoint = `https://${ENVIRONMENT}.tags.static.${STAGE}.com`;

export const hostedCheckoutEndpoint = `https://${ENVIRONMENT}.checkout.${STAGE}.com`;

export const fetchPtToken = async (
  apiKey: string,
): Promise<
  | {
      'pt-token': string;
      origin: string;
      challengeOptions: object;
    }
  | false
> => {
  for (let i = 0; i < 5; i++) {
    const token = await getData(transactionEndpoint, apiKey);
    if (token['pt-token']) {
      return token;
    }
  }
  return false;
};

const sendTransactingMessageToField = (
  field: ElementTypes,
  billingInfo: BillingInfo,
  channel?: MessagePort,
) => {
  const iframeId = `${field}-iframe`;
  const iframe = document.getElementsByName(iframeId)[0];
  if (iframe) {
    postMessageToHostedField(
      `${field}-iframe`,
      {
        type: 'pt-static:transact',
        element: field,
        billingInfo,
      },
      channel,
    );
  }
};

export const sendTransactingMessage = (
  transacting: PayTheoryHostedFieldTransactional,
  billingInfo: BillingInfo,
) =>
  new Promise<ErrorMessage | FieldsReadyMessage>(resolve => {
    // Opening a new message channel, so we can await the response from the hosted field
    const channel = new MessageChannel();

    channel.port1.onmessage = ({ data }) => {
      channel.port1.close();
      resolve(data);
    };

    const types = transacting.fieldTypes;
    const transactingField = types.filter(field =>
      [CASH_IFRAME, ACH_IFRAME, CARD_IFRAME].includes(`${field}-iframe`),
    );
    const siblingFields = types.filter(
      field => ![CASH_IFRAME, ACH_IFRAME, CARD_IFRAME].includes(`${field}-iframe`),
    );
    // Sending the message to the hosted field to transact first so that the channel port is saved in state
    // That will allow it to respond once it receives the message from the sibling fields
    transactingField.forEach(field =>
      sendTransactingMessageToField(field, billingInfo, channel.port2),
    );
    siblingFields.forEach(field => sendTransactingMessageToField(field, billingInfo));
  });
