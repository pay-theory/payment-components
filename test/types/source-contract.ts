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
