/* eslint-disable no-undef */
/**
 * Configuration constants for local testing
 */

// API Configuration - These MUST be provided by setting window.ENV_CONFIG before loading this script
// or they will be read from process.env if running through webpack
const ENV_CONFIG = window.ENV_CONFIG || {};

const API_KEY =
  ENV_CONFIG.PAYTHEORY_API_KEY ||
  (typeof process !== 'undefined' && process.env && process.env.PAYTHEORY_API_KEY);
if (!API_KEY) {
  throw new Error(
    'PAYTHEORY_API_KEY must be set. Either set window.ENV_CONFIG.PAYTHEORY_API_KEY before loading this script, or set it in .env file when building with webpack.',
  );
}

const AMOUNT = 102; // $1.02 in cents

// Wallet Test Configuration
const WALLET_CONFIG = {
  API_KEY: API_KEY,
  TEST_AMOUNT:
    parseInt(
      ENV_CONFIG.TEST_AMOUNT ||
        (typeof process !== 'undefined' && process.env && process.env.TEST_AMOUNT),
    ) || 1000,
  GOOGLE_MERCHANT_ID:
    ENV_CONFIG.GOOGLE_MERCHANT_ID ||
    (typeof process !== 'undefined' && process.env && process.env.GOOGLE_MERCHANT_ID),
  GOOGLE_GATEWAY_MERCHANT_ID:
    ENV_CONFIG.GOOGLE_GATEWAY_MERCHANT_ID ||
    (typeof process !== 'undefined' && process.env && process.env.GOOGLE_GATEWAY_MERCHANT_ID),
};

// Validate required wallet configuration
if (!WALLET_CONFIG.API_KEY) {
  throw new Error('PAYTHEORY_API_KEY must be set');
}
if (!WALLET_CONFIG.GOOGLE_MERCHANT_ID) {
  throw new Error('GOOGLE_MERCHANT_ID must be set');
}
if (!WALLET_CONFIG.GOOGLE_GATEWAY_MERCHANT_ID) {
  throw new Error('GOOGLE_GATEWAY_MERCHANT_ID must be set');
}

// Export wallet configuration for use by other scripts
window.WALLET_CONFIG = WALLET_CONFIG;

// Fee configuration - will be set after PayTheory SDK loads
let FEE_MODE = null;

// Test data
const PAYOR_INFO = {
  first_name: 'User',
  last_name: 'Name',
};

const BILLING_INFO = {
  name: 'Some Body',
  address: {
    line1: '123 Street St',
    line2: 'Apartment 17',
    city: 'Somewhere',
    region: 'OH',
    postal_code: '12345',
    country: 'USA',
  },
};

// Checkout details for Button and QR components
const CHECKOUT_DETAILS = {
  amount: AMOUNT,
  paymentName: 'Test Purchase',
  callToAction: 'PAY',
  acceptedPaymentMethods: 'ALL',
  payorInfo: PAYOR_INFO,
  billingInfo: BILLING_INFO,
  accountCode: '12 Account Code',
  reference: '12 Reference',
};

// Transaction parameters for field-based payments
const TRANSACTING_PARAMETERS = {
  amount: AMOUNT,
  // fee: 300,
  billingInfo: BILLING_INFO,
  accountCode: '12 Account Code',
  reference: '12 Reference',
  // expandedResponse will be set dynamically based on checkbox
};

// Tokenization parameters
const TOKENIZE_PAYMENT_METHOD_PARAMETERS = {
  payorInfo: PAYOR_INFO,
  billingInfo: BILLING_INFO,
  skipValidation: true,
};

// Initialize fee mode when SDK loads
function initializeFeeMode() {
  if (typeof paytheory !== 'undefined' && paytheory.MERCHANT_FEE) {
    FEE_MODE = paytheory.MERCHANT_FEE;
    TRANSACTING_PARAMETERS.feeMode = FEE_MODE;
    CHECKOUT_DETAILS.feeMode = FEE_MODE;
  }
}
