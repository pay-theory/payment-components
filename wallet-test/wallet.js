// Load configuration from config.js - REQUIRED
if (!window.WALLET_CONFIG) {
  throw new Error('WALLET_CONFIG not found. Make sure config.js is loaded before wallet.js');
}
// Validate required configuration
if (!API_KEY) {
  throw new Error('API_KEY is required in WALLET_CONFIG');
}
if (!window.WALLET_CONFIG.GOOGLE_MERCHANT_ID) {
  throw new Error('GOOGLE_MERCHANT_ID is required in WALLET_CONFIG');
}
if (!window.WALLET_CONFIG.GOOGLE_GATEWAY_MERCHANT_ID) {
  throw new Error('GOOGLE_GATEWAY_MERCHANT_ID is required in WALLET_CONFIG');
}

/**
 * Response Handling Changes:
 *
 * The PayTheory SDK now returns typed responses:
 *
 * 1. Apple Pay Merchant Validation:
 *    - Success: { type: 'SUCCESS', session: { session: <ApplePaySession> } }
 *    - Error: { type: 'ERROR', error: string }
 *
 * 2. Wallet Transactions:
 *    - Success: { type: 'SUCCESS', transaction: <FullTransactionObject> }
 *    - Error: { type: 'ERROR', error: string }
 *
 * Transaction statuses can be:
 * - PENDING: Transaction is processing
 * - SUCCEEDED: Transaction completed successfully
 * - FAILED: Transaction failed (connection will auto-refresh for retry)
 * - CANCELED, VOIDED, etc.: Other statuses
 *
 * Note: walletType values should use the constants from the PayTheoryMessenger class
 */

// Global messenger instance
let messenger = null;
let googlePaymentsClient = null;

// Google Pay configuration
const GOOGLE_PAY_CONFIG = {
  environment: 'PRODUCTION',
  apiVersion: 2,
  apiVersionMinor: 0,
  merchantInfo: {
    merchantName: 'Pay Theory',
    merchantId: window.WALLET_CONFIG.GOOGLE_MERCHANT_ID,
  },
  allowedPaymentMethods: [
    {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'],
        billingAddressRequired: true,
        billingAddressParameters: {
          format: 'FULL',
          phoneNumberRequired: true,
        },
      },
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          gateway: 'paytheory',
          gatewayMerchantId: window.WALLET_CONFIG.GOOGLE_GATEWAY_MERCHANT_ID,
        },
      },
    },
  ],
  transactionInfo: {
    countryCode: 'US',
    currencyCode: 'USD',
    totalPriceStatus: 'FINAL',
    totalPrice: '1.00',
  },
};

// Initialize everything when page loads
window.addEventListener('DOMContentLoaded', async () => {
  await initializeMessenger();
  checkWalletAvailability();
});

// Initialize PayTheory Messenger immediately
async function initializeMessenger() {
  try {
    messenger = new window.PayTheoryMessenger({ apiKey: API_KEY });
    await messenger.initialize();
    console.log('PayTheory Messenger initialized successfully');

    // Hide loading message
    document.getElementById('loading').style.display = 'none';
    document.getElementById('payment-buttons').style.display = 'flex';
  } catch (error) {
    console.error('Failed to initialize messenger:', error);
    document.getElementById('loading').textContent =
      'Failed to initialize payment system: ' + error.message;
  }
}

// Check wallet availability
function checkWalletAvailability() {
  let walletsAvailable = false;

  // Check Apple Pay
  if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
    document.getElementById('apple-pay-button').style.display = 'block';
    walletsAvailable = true;
  }

  // Check Google Pay
  if (window.google && google.payments) {
    googlePaymentsClient = new google.payments.api.PaymentsClient({
      environment: GOOGLE_PAY_CONFIG.environment,
    });

    googlePaymentsClient
      .isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: GOOGLE_PAY_CONFIG.allowedPaymentMethods,
      })
      .then(response => {
        if (response.result) {
          renderGooglePayButton();
          walletsAvailable = true;
        }
      })
      .catch(err => {
        console.error('Google Pay check failed:', err);
      });
  }

  // Show message if no wallets available
  setTimeout(() => {
    if (
      !document.getElementById('apple-pay-button').style.display &&
      !document.getElementById('google-pay-button').firstChild
    ) {
      document.getElementById('not-available').style.display = 'block';
    }
  }, 1000);
}

// Apple Pay Handler
async function handleApplePay() {
  if (!messenger) {
    showStatus('Payment system not initialized', 'error');
    return;
  }

  const request = {
    countryCode: 'US',
    currencyCode: 'USD',
    total: {
      label: 'Test Purchase',
      amount: (AMOUNT / 100).toFixed(2),
    },
    supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
    merchantCapabilities: ['supports3DS'],
  };

  const session = new ApplePaySession(3, request);

  session.onvalidatemerchant = async event => {
    try {
      showStatus('Validating merchant...', 'info');
      const response = await messenger.getApplePaySession();
      // Check if response is successful (ResponseMessageTypes.SUCCESS)
      if (response.type === 'SUCCESS' && response.session) {
        // Extract the actual session object from the nested structure
        const sessionData = response.session.session || response.session;
        session.completeMerchantValidation(sessionData);
      } else if (response.type === 'ERROR') {
        throw new Error(response.error || 'Merchant validation failed');
      } else {
        throw new Error('Invalid response format from merchant validation');
      }
    } catch (error) {
      showStatus('Merchant validation failed: ' + error.message, 'error');
      session.abort();
    }
  };

  session.onpaymentauthorized = async event => {
    try {
      showStatus('Processing payment...', 'info');

      // Stringify the event
      const eventString = JSON.stringify(event.payment);

      const result = await messenger.processWalletTransaction({
        amount: AMOUNT,
        digitalWalletPayload: eventString,
        walletType: window.PayTheoryMessenger.applePay,
      });

      console.log('Transaction Result', result);

      // Check response type
      if (result.type === 'SUCCESS') {
        // Transaction response with full transaction data
        const transaction = result.transaction;

        if (transaction.status === 'PENDING' || transaction.status === 'SUCCEEDED') {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          showStatus(`Payment successful!\n${formatTransactionDetails(transaction)}`, 'success');
        } else if (transaction.status === 'FAILED') {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          const failureMessage = transaction.failure_reasons?.join(', ') || 'Unknown reason';
          showStatus(
            `Payment failed!\n${formatTransactionDetails(transaction)}\nReason: ${failureMessage}`,
            'error',
          );
        } else {
          // Other statuses (CANCELED, VOIDED, etc.)
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          showStatus(`Payment processed\n${formatTransactionDetails(transaction)}`, 'info');
        }
      } else if (result.type === 'ERROR') {
        // Error response
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        showStatus('Payment failed: ' + result.error, 'error');
      } else {
        // Legacy format or unexpected response
        if (result.success) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          showStatus(`Payment successful! Transaction ID: ${result.transaction_id}`, 'success');
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          showStatus('Payment failed: ' + (result.error || 'Unknown error'), 'error');
        }
      }
    } catch (error) {
      session.completePayment(ApplePaySession.STATUS_FAILURE);
      showStatus('Payment failed: ' + error.message, 'error');
    }
  };

  session.begin();
}

// Google Pay Button Renderer
function renderGooglePayButton() {
  const button = googlePaymentsClient.createButton({
    onClick: handleGooglePay,
    buttonType: 'plain',
    buttonColor: 'black',
  });
  document.getElementById('google-pay-button').appendChild(button);
  document.getElementById('google-pay-button').style.display = 'block';
}

// Google Pay Handler
async function handleGooglePay() {
  if (!messenger) {
    showStatus('Payment system not initialized', 'error');
    return;
  }

  try {
    const paymentData = await googlePaymentsClient.loadPaymentData(GOOGLE_PAY_CONFIG);
    showStatus('Processing payment...', 'info');

    const result = await messenger.processWalletTransaction({
      amount: AMOUNT,
      digitalWalletPayload: JSON.stringify(paymentData),
      walletType: window.PayTheoryMessenger.googlePay,
    });

    console.log('Transaction Result', result);

    // Check response type
    if (result.type === 'SUCCESS') {
      // Transaction response with full transaction data
      const transaction = result.transaction;

      if (transaction.status === 'PENDING' || transaction.status === 'SUCCEEDED') {
        showStatus(`Payment successful!\n${formatTransactionDetails(transaction)}`, 'success');
      } else if (transaction.status === 'FAILED') {
        const failureMessage = transaction.failure_reasons?.join(', ') || 'Unknown reason';
        showStatus(
          `Payment failed!\n${formatTransactionDetails(transaction)}\nReason: ${failureMessage}`,
          'error',
        );
      } else {
        // Other statuses (CANCELED, VOIDED, etc.)
        showStatus(`Payment processed\n${formatTransactionDetails(transaction)}`, 'info');
      }
    } else if (result.type === 'ERROR') {
      // Error response
      showStatus('Payment failed: ' + result.error, 'error');
    } else {
      // Legacy format or unexpected response
      if (result.success) {
        showStatus(`Payment successful! Transaction ID: ${result.transaction_id}`, 'success');
      } else {
        showStatus('Payment failed: ' + (result.error || 'Unknown error'), 'error');
      }
    }
  } catch (error) {
    if (error.statusCode === 'CANCELED') {
      showStatus('Payment cancelled', 'info');
    } else {
      showStatus('Payment failed: ' + error.message, 'error');
    }
  }
}

// Status Display Helper
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.className = 'status ' + type;

  // Support multi-line messages
  if (message.includes('\n')) {
    statusEl.innerHTML = message.split('\n').join('<br>');
  } else {
    statusEl.textContent = message;
  }

  statusEl.style.display = 'block';

  if (type === 'info') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}

// Helper to format transaction details for display
function formatTransactionDetails(transaction) {
  const details = [
    `Transaction ID: ${transaction.transaction_id}`,
    `Status: ${transaction.status}`,
    `Amount: $${(transaction.gross_amount / 100).toFixed(2)}`,
    `Fees: $${(transaction.fees / 100).toFixed(2)}`,
    `Net: $${(transaction.net_amount / 100).toFixed(2)}`,
  ];

  if (transaction.payment_method) {
    details.push(
      `Card: ${transaction.payment_method.card_brand} ****${transaction.payment_method.last_four}`,
    );
  }

  if (transaction.avs_status) {
    details.push(`AVS: ${transaction.avs_status}`);
  }

  return details.join('\n');
}

// Simulate wallet transaction for testing
async function simulateWalletTransaction() {
  if (!messenger) {
    showStatus('Payment system not initialized', 'error');
    return;
  }

  try {
    showStatus('Processing simulated transaction...', 'info');

    const result = await messenger.processWalletTransaction({
      amount: AMOUNT,
      digitalWalletPayload: 'SUCCESS',
      walletType: 'TEST',
    });

    console.log('Simulated Transaction Result', result);

    // Check response type
    if (result.type === 'SUCCESS') {
      // Transaction response with full transaction data
      const transaction = result.transaction;

      if (transaction.status === 'PENDING' || transaction.status === 'SUCCEEDED') {
        showStatus(
          `Test transaction successful!\n${formatTransactionDetails(transaction)}`,
          'success',
        );
      } else if (transaction.status === 'FAILED') {
        const failureMessage = transaction.failure_reasons?.join(', ') || 'Unknown reason';
        showStatus(
          `Test transaction failed!\n${formatTransactionDetails(transaction)}\nReason: ${failureMessage}`,
          'error',
        );
      } else {
        // Other statuses (CANCELED, VOIDED, etc.)
        showStatus(`Test transaction processed\n${formatTransactionDetails(transaction)}`, 'info');
      }
    } else if (result.type === 'ERROR') {
      // Error response
      showStatus('Test transaction failed: ' + result.error, 'error');
    } else {
      // Legacy format or unexpected response
      if (result.success) {
        showStatus(
          `Test transaction successful! Transaction ID: ${result.transaction_id}`,
          'success',
        );
      } else {
        showStatus('Test transaction failed: ' + (result.error || 'Unknown error'), 'error');
      }
    }
  } catch (error) {
    showStatus('Test transaction failed: ' + error.message, 'error');
  }
}
