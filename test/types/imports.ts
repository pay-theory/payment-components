import type {
  CallToAction,
  PayTheoryPaymentFieldsInput,
  PayTheoryQRInput,
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

  const applePayResult = await messenger.getApplePaySession();
  if (applePayResult.type === 'SUCCESS' && applePayResult.session.success) {
    applePayResult.session.session;
  }

  // @ts-expect-error The runtime owns the Apple Pay response shape; callers cannot assert one.
  await messenger.getApplePaySession<{ merchantSessionIdentifier: string }>();

  // @ts-expect-error Checkout contexts are reserved for the Pay Theory checkout portal.
  new sdk.PayTheoryMessenger({ checkoutContext: { invoiceId: 'invoice-id' } });

  // @ts-expect-error Invoice email resends are reserved for the Pay Theory checkout portal.
  await messenger.resendInvoiceEmail();
};

// @ts-expect-error Amounts are expressed as integer cents, not formatted strings.
const invalidTransaction: TransactProps = { amount: '25.00' };

// @ts-expect-error CHECKOUT is exported for compatibility but rejected by hosted checkout inputs.
const invalidCallToAction: CallToAction = 'CHECKOUT';

// @ts-expect-error Partner integrations authenticate hosted fields with an API key.
const checkoutFields: PayTheoryPaymentFieldsInput = { checkoutContext: { invoiceId: 'id' } };

const invalidWallet: WalletTransactionPayload = {
  amount: 100,
  digitalWalletPayload: {},
  // @ts-expect-error Wallet identifiers are exact public enum values.
  walletType: 'apple',
};

// @ts-expect-error Wallet payment payloads require integer-cent amount input.
const incompleteWallet: WalletTransactionPayload = {
  digitalWalletPayload: {},
  walletType: 'APPLE_PAY',
};

void invalidWallet;
void incompleteWallet;
void invalidTransaction;
void invalidCallToAction;
void checkoutFields;
void consumeSdk;

const invalidCountry: PayTheoryPaymentFieldsInput = {
  apiKey: 'partner-api-key',
  // @ts-expect-error Countries use supported ISO-like exact literals.
  country: 'US',
};
const invalidQr: PayTheoryQRInput = {
  apiKey: 'partner-api-key',
  checkoutDetails: { amount: 100, paymentName: 'Synthetic' },
  // @ts-expect-error A QR ready callback receives true, never a session object.
  onReady: (_ready: { sessionId: string }) => {},
};
void invalidCountry;
void invalidQr;
