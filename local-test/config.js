/**
 * Configuration constants for local testing
 */

// API Configuration
// const API_KEY = "start-paytheory-62d8597c57af5d64a7ebee0a8fd3d3cc";
const AMOUNT = 10000; // $100.00 in cents

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
  fee: 300,
  billingInfo: BILLING_INFO,
  accountCode: '12 Account Code',
  reference: '12 Reference',
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
