import runtimeSdk from '../../src/index';
import RuntimeHostedFieldTransactional from '../../src/components/pay-theory-hosted-field-transactional';
import RuntimePayTheoryMessenger from '../../src/messenger/pay-theory-messenger';
import type { PayTheoryMessenger, PayTheorySDK, TokenizeProps } from '../../dist/paytheory-sdk';

type Exact<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2
    ? (<T>() => T extends TRight ? 1 : 2) extends <T>() => T extends TLeft ? 1 : 2
      ? true
      : false
    : false;
type Assert<TValue extends true> = TValue;

/**
 * Compile-only assertions that keep the handwritten, standalone contract assignable from the
 * implementation. These deliberately compare callable members as well as the root property names.
 */
const publicSdkContract: PayTheorySDK = runtimeSdk;
const publicMessengerContract: typeof PayTheoryMessenger = RuntimePayTheoryMessenger;

// The hosted-field adapter must consume the canonical tokenization input without redefining it.
type HostedFieldTokenizeInput = Parameters<RuntimeHostedFieldTransactional['tokenize']>[0];
type TokenizeInputUsesCanonicalContract = Assert<Exact<HostedFieldTokenizeInput, TokenizeProps>>;

void publicSdkContract;
void publicMessengerContract;
void (true as TokenizeInputUsesCanonicalContract);

// Every implemented public payment action must keep the canonical input tuple.
// Return types may be narrower than the compatibility declarations (cancel includes legacy void).
type PublicAction = 'transact' | 'confirm' | 'cancel' | 'tokenizePaymentMethod' | 'updateAmount';
type ActionInputMatches = {
  [Key in PublicAction]: Exact<Parameters<(typeof runtimeSdk)[Key]>, Parameters<PayTheorySDK[Key]>>;
};
type AllActionInputsMatch = Assert<Exact<ActionInputMatches[PublicAction], true>>;
type AppleSessionOutputMatches = Assert<
  Exact<
    ReturnType<RuntimePayTheoryMessenger['getApplePaySession']>,
    ReturnType<PayTheoryMessenger['getApplePaySession']>
  >
>;
type WalletInputMatches = Assert<
  Exact<
    Parameters<RuntimePayTheoryMessenger['processWalletTransaction']>,
    Parameters<PayTheoryMessenger['processWalletTransaction']>
  >
>;
type WalletOutputMatches = Assert<
  Exact<
    ReturnType<RuntimePayTheoryMessenger['processWalletTransaction']>,
    ReturnType<PayTheoryMessenger['processWalletTransaction']>
  >
>;
void (true as AllActionInputsMatch);
void (true as AppleSessionOutputMatches);
void (true as WalletInputMatches);
void (true as WalletOutputMatches);
