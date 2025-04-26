// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { postMessageToHostedField } from './message';
import PayTheoryHostedFieldTransactional from '../components/pay-theory-hosted-field-transactional';
import { BillingInfo } from './pay_theory_types';
import { ErrorMessage, FieldsReadyMessage } from './format';
import { BANK_IFRAME, CARD_IFRAME, CASH_IFRAME, ElementTypes } from './data';

interface PtToken {
  'pt-token': string;
  origin: string;
  challengeOptions: object;
}

export const getData = async (
  url: string,
  apiKey: string,
  sessionKey: string,
): Promise<PtToken | object> => {
  console.log(`[PT Debug] Attempting to fetch data from ${url}`);
  console.log(
    `[PT Debug] API Key: ${apiKey ? 'PROVIDED' : 'MISSING'}, Session Key: ${sessionKey ? 'PROVIDED' : 'MISSING'}`,
  );

  const options: RequestInit = {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'x-api-key': apiKey,
      'x-session-key': sessionKey,
    },
  };

  try {
    /* global fetch */
    console.log(`[PT Debug] Making network request to: ${url}`);
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`[PT Debug] Response received:`, data);
    return data;
  } catch (error) {
    console.error(`[PT Debug] Error fetching data from ${url}:`, error);
    return {};
  }
};

export const PARTNER = process.env.ENV;
export const STAGE = process.env.STAGE;
const TARGET_MODE = process.env.TARGET_MODE;
const ENVIRONMENT = `${PARTNER}${TARGET_MODE}`;

console.log('[PT Debug] Environment Variables:');
console.log(`[PT Debug] PARTNER (ENV): ${PARTNER}`);
console.log(`[PT Debug] STAGE: ${STAGE}`);
console.log(`[PT Debug] TARGET_MODE: ${TARGET_MODE}`);
console.log(`[PT Debug] Constructed ENVIRONMENT: ${ENVIRONMENT}`);

export const transactionEndpoint = `https://${ENVIRONMENT}.${STAGE}.com/pt-token-service/`;
console.log(`[PT Debug] Constructed transactionEndpoint: ${transactionEndpoint}`);

export const hostedFieldsEndpoint = `https://${ENVIRONMENT}.tags.static.${STAGE}.com`;
console.log(`[PT Debug] Constructed hostedFieldsEndpoint: ${hostedFieldsEndpoint}`);

export const hostedCheckoutEndpoint = `https://${ENVIRONMENT}.checkout.${STAGE}.com`;
console.log(`[PT Debug] Constructed hostedCheckoutEndpoint: ${hostedCheckoutEndpoint}`);

export const fetchPtToken = async (
  apiKey: string,
  sessionKey: string,
): Promise<PtToken | false> => {
  console.log(
    `[PT Debug] Attempting to fetch pt-token with apiKey: ${apiKey ? 'PROVIDED' : 'MISSING'} and sessionKey: ${sessionKey ? 'PROVIDED' : 'MISSING'}`,
  );
  console.log(`[PT Debug] Token endpoint: ${transactionEndpoint}`);

  for (let i = 0; i < 5; i++) {
    console.log(`[PT Debug] Attempt ${i + 1} to fetch pt-token`);
    const token = await getData(transactionEndpoint, apiKey, sessionKey);
    console.log(`[PT Debug] Token response:`, token);
    if ((token as PtToken)['pt-token']) {
      console.log(`[PT Debug] Successfully retrieved pt-token on attempt ${i + 1}`);
      return token as PtToken;
    }
    console.log(`[PT Debug] Failed to retrieve pt-token on attempt ${i + 1}`);
  }
  console.error(`[PT Debug] All attempts to fetch pt-token failed`);
  return false;
};

const sendTransactingMessageToField = (
  field: ElementTypes,
  billingInfo: BillingInfo,
  channel?: MessagePort,
) => {
  postMessageToHostedField(
    `${field}-iframe`,
    {
      type: 'pt-static:transact',
      element: field,
      billingInfo,
    },
    channel,
  );
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
      resolve(data as ErrorMessage | FieldsReadyMessage);
    };

    const types = transacting.fieldTypes;
    const transactingField = types.filter(field =>
      [CASH_IFRAME, BANK_IFRAME, CARD_IFRAME].includes(`${field}-iframe`),
    );
    const siblingFields = types.filter(
      field => ![CASH_IFRAME, BANK_IFRAME, CARD_IFRAME].includes(`${field}-iframe`),
    );
    // Sending the message to the hosted field to transact first so that the channel port is saved in state
    // That will allow it to respond once it receives the message from the sibling fields
    transactingField.forEach(field => {
      sendTransactingMessageToField(field, billingInfo, channel.port2);
    });
    siblingFields.forEach(field => {
      sendTransactingMessageToField(field, billingInfo);
    });
  });
