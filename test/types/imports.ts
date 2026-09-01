import type {
  CallToAction,
  CheckoutContextQuery,
  PayTheoryPaymentFieldsInput,
  PayTheorySDK,
  StateObject,
  TokenizeResult,
  TransactProps,
  TransactResult,
  WalletTransactionPayload,
} from '../../dist/paytheory-sdk';

declare const sdk: PayTheorySDK;

const fields: PayTheoryPaymentFieldsInput = {
  apiKey: 'partner-api-key',
  country: 'USA',
  feeMode: 'merchant_fee',
};

const checkoutFields: PayTheoryPaymentFieldsInput = {
  checkoutContext: { invoiceId: 'invoice-id' },
  country: 'USA',
};

const transaction: TransactProps = {
  amount: 2500,
  payorInfo: {
    same_as_billing: true,
    email: 'ada@example.com',
  },
};

const walletTransaction: WalletTransactionPayload = {
  amount: 2500,
  digitalWalletPayload: {},
  walletType: 'APPLE_PAY',
};

const consumeSdk = async () => {
  const result: TransactResult = await sdk.transact(transaction);
  await sdk.payTheoryFields(fields);
  await sdk.payTheoryFields(checkoutFields);

  if (result.type === 'SUCCESS') {
    result.body.payment_method_id;
  }

  const tokenized: TokenizeResult = await sdk.tokenizePaymentMethod({ expandedResponse: true });
  if (tokenized.type === 'FAILED') {
    tokenized.body.failure_code;
    tokenized.body.failure_text;
  }

  sdk.stateObserver((state: StateObject) => {
    state['card-number']?.iframeLoaded;
  });

  const messenger = new sdk.PayTheoryMessenger({ apiKey: 'partner-api-key' });
  await messenger.processWalletTransaction(walletTransaction);

  const checkoutMessenger = new sdk.PayTheoryMessenger({
    checkoutContext: { sessionId: 'session-id' },
  });
  await checkoutMessenger.resendInvoiceEmail();

  const applePayResult = await messenger.getApplePaySession();
  if (applePayResult.type === 'SUCCESS' && applePayResult.session.success) {
    applePayResult.session.session;
  }

  // @ts-expect-error The runtime owns the Apple Pay response shape; callers cannot assert one.
  await messenger.getApplePaySession<{ merchantSessionIdentifier: string }>();
};

// @ts-expect-error Amounts are expressed as integer cents, not formatted strings.
const invalidTransaction: TransactProps = { amount: '25.00' };

// @ts-expect-error CHECKOUT is exported for compatibility but rejected by hosted checkout inputs.
const invalidCallToAction: CallToAction = 'CHECKOUT';

// @ts-expect-error Hosted fields accept either an API key or a checkout context, never both.
const bothAuth: PayTheoryPaymentFieldsInput = { apiKey: 'k', checkoutContext: { linkId: 'l' } };

// @ts-expect-error A checkout context identifies exactly one hosted-checkout resource.
const ambiguousContext: CheckoutContextQuery = { invoiceId: 'id', linkId: 'id' };

void invalidTransaction;
void invalidCallToAction;
void bothAuth;
void ambiguousContext;
void consumeSdk;
