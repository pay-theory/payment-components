// Configuration
const API_KEY = 'austin-paytheorylab-d7dbe665f5565fe8ae8a23eab45dd285'; // Replace with your API key
const AMOUNT = 1000; // $10.00 in cents

// Global messenger instance
let messenger = null;
let googlePaymentsClient = null;

// Google Pay configuration
const GOOGLE_PAY_CONFIG = {
  environment: 'TEST', // Change to 'PRODUCTION' for live
  merchantInfo: {
    merchantId: 'YOUR_MERCHANT_ID', // Replace with actual merchant ID
    merchantName: 'Test Merchant',
  },
  paymentDataRequest: {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'paytheory',
            gatewayMerchantId: 'YOUR_GATEWAY_MERCHANT_ID',
          },
        },
      },
    ],
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPrice: (AMOUNT / 100).toFixed(2),
      currencyCode: 'USD',
    },
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
    messenger = new window.paytheory.PayTheoryMessenger({ apiKey: API_KEY });
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
        allowedPaymentMethods: GOOGLE_PAY_CONFIG.paymentDataRequest.allowedPaymentMethods,
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
      console.log('Apple Pay session response', response);
      if (response.success && response.session) {
        session.completeMerchantValidation(response.session);
      } else {
        throw new Error(response.error || 'Merchant validation failed');
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
        walletType: 'APPLE_PAY',
      });

      console.log('Result', result);

      if (result.success) {
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
        showStatus(`Payment successful! Transaction ID: ${result.transaction_id}`, 'success');
      } else {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        showStatus('Payment failed: ' + (result.error || 'Unknown error'), 'error');
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
    const paymentData = await googlePaymentsClient.loadPaymentData(
      GOOGLE_PAY_CONFIG.paymentDataRequest,
    );
    showStatus('Processing payment...', 'info');

    const result = await messenger.processWalletTransaction({
      amount: AMOUNT,
      digitalWalletPayload: paymentData,
      walletType: 'GOOGLE_PAY',
    });

    if (result.success) {
      showStatus(`Payment successful! Transaction ID: ${result.transaction_id}`, 'success');
    } else {
      showStatus('Payment failed: ' + (result.error || 'Unknown error'), 'error');
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
  statusEl.textContent = message;
  statusEl.style.display = 'block';

  if (type === 'info') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}
