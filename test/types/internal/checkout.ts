import type {
  CheckoutContextQuery,
  CheckoutPaymentFieldsInput,
  PayTheoryAuthOptions,
  PayTheoryPaymentFieldsInput,
  PayTheorySDK,
} from '../../../dist-internal/paytheory-sdk';

declare const sdk: PayTheorySDK;

const invoiceFields: CheckoutPaymentFieldsInput = {
  checkoutContext: { invoiceId: 'invoice-id' },
  country: 'USA',
};

const apiKeyFields: PayTheoryPaymentFieldsInput = { apiKey: 'partner-api-key' };

const consumeCheckoutSdk = async () => {
  await sdk.payTheoryFields(invoiceFields);
  await sdk.payTheoryFields(apiKeyFields);
  await window.paytheory.payTheoryFields({ checkoutContext: { linkId: 'link-id' } });

  const messenger = new window.paytheory.PayTheoryMessenger({
    checkoutContext: { sessionId: 'session-id' },
  });
  const resent = await messenger.resendInvoiceEmail();
  resent.success;

  const auth: PayTheoryAuthOptions = { apiKey: 'partner-api-key' };
  new sdk.PayTheoryMessenger(auth);
};

// @ts-expect-error Authenticate with an API key or a checkout context, never both.
const bothAuth: PayTheoryAuthOptions = { apiKey: 'k', checkoutContext: { linkId: 'l' } };

// @ts-expect-error A checkout context identifies exactly one hosted-checkout resource.
const ambiguousContext: CheckoutContextQuery = { invoiceId: 'id', linkId: 'id' };

void bothAuth;
void ambiguousContext;
void consumeCheckoutSdk;
