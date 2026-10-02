import runtimeSdk from '../../../src/index';
import RuntimePayTheoryMessenger from '../../../src/messenger/pay-theory-messenger';
import type { PayTheoryMessenger, PayTheorySDK } from '../../../dist-internal/paytheory-sdk';

/**
 * Compile-only assertions that the runtime also satisfies the internal (checkout-portal)
 * contract, so the checkout-context constructor and `resendInvoiceEmail` cannot drift from it.
 */
const internalSdkContract: PayTheorySDK = runtimeSdk;
const internalMessengerContract: typeof PayTheoryMessenger = RuntimePayTheoryMessenger;

void internalSdkContract;
void internalMessengerContract;
