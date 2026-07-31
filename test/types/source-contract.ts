import runtimeSdk from '../../src/index';
import RuntimePayTheoryMessenger from '../../src/messenger/pay-theory-messenger';
import type { PayTheoryMessenger, PayTheorySDK } from '../../dist/paytheory-sdk';

/**
 * Compile-only assertions that keep the handwritten, standalone contract assignable from the
 * implementation. These deliberately compare callable members as well as the root property names.
 */
const publicSdkContract: PayTheorySDK = runtimeSdk;
const publicMessengerContract: typeof PayTheoryMessenger = RuntimePayTheoryMessenger;

void publicSdkContract;
void publicMessengerContract;
