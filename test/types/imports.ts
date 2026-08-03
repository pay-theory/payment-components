import type {
  CallToAction,
  PayTheoryPaymentFieldsInput,
  PayTheorySDK,
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

  const messenger = new sdk.PayTheoryMessenger({ apiKey: 'partner-api-key' });
  await messenger.processWalletTransaction(walletTransaction);

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

void invalidTransaction;
void invalidCallToAction;
void consumeSdk;
