/**
 * Payment Fields Management
 * Handles field-based payments (Card, ACH, Cash)
 */

/* global paytheory, API_KEY, AMOUNT, FEE_MODE, TRANSACTING_PARAMETERS, TOKENIZE_PAYMENT_METHOD_PARAMETERS, initializeFeeMode */

class PaymentFieldsManager {
  constructor() {
    this.validationState = {
      card: false,
      ach: false,
      cash: false,
    };

    this.confirmationState = {
      hasConfirmation: false,
      confirmationData: null,
    };

    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    // Status and UI elements
    this.statusEl = document.getElementById('status');
    this.errorDiv = document.getElementById('error');
    this.resultContainer = document.getElementById('result-container');
    this.resultText = document.getElementById('result-text');

    // Button elements
    this.paymentBtn = document.getElementById('initiate-payment');
    this.paymentWithConfirmationBtn = document.getElementById('initiate-payment-with-confirmation');
    this.tokenizeBtn = document.getElementById('tokenize');
    this.confirmBtn = document.getElementById('confirm-payment');
    this.cancelBtn = document.getElementById('cancel-payment');
    this.confirmationInitialEl = document.querySelector('.confirmation-initial');
    this.confirmationActionsEl = document.querySelector('.confirmation-actions');
  }

  attachEventListeners() {
    this.paymentBtn.addEventListener('click', e => this.processTransaction(e));
    this.paymentWithConfirmationBtn.addEventListener('click', e =>
      this.processTransactionWithConfirmation(e),
    );
    this.tokenizeBtn.addEventListener('click', e => this.tokenizePaymentMethod(e));
    this.confirmBtn.addEventListener('click', e => this.confirmPayment(e));
    this.cancelBtn.addEventListener('click', e => this.cancelPayment(e));
  }

  setupPayTheoryObservers() {
    if (typeof paytheory === 'undefined') return;

    paytheory.errorObserver(e => {
      console.log(e, 'error');
      this.showError(e.error);
    });

    paytheory.stateObserver(e => {
      // console.log(e, "state")
    });

    paytheory.validObserver(e => {
      console.log(e, 'valid');
      this.validationState = {
        card: e.includes('card'),
        ach: e.includes('ach'),
        cash: e.includes('cash'),
      };
    });
  }

  initializePayTheoryFields() {
    console.log('🔧 Initializing PayTheory Fields...');
    this.updateStatus('Initializing payment fields...', 'info');
    this.hideError();
    this.hideResult();

    try {
      if (typeof paytheory !== 'undefined') {
        console.log('✅ PayTheory object available for fields');
        console.log('Available methods:', Object.keys(paytheory));

        // Setup observers first
        this.setupPayTheoryObservers();

        // Initialize fee mode
        initializeFeeMode();
        console.log('Fee mode initialized:', FEE_MODE);

        // Initialize PayTheory fields
        console.log('🔧 Calling paytheory.payTheoryFields with config...');
        const fieldsConfig = {
          apiKey: API_KEY,
          country: 'USA',
          amount: AMOUNT,
          styles: {
            default: {
              color: '#333',
              fontSize: '14px',
            },
          },
        };
        console.log('Fields config:', fieldsConfig);

        const result = paytheory.payTheoryFields(fieldsConfig);
        console.log('payTheoryFields result:', result);

        this.updateStatus(
          'PayTheory SDK initialized! Fill out the payment fields to enable transaction buttons.',
          'success',
        );
      } else {
        console.error('PayTheory SDK not available');
        this.updateStatus(
          'PayTheory SDK not loaded. Check that index.js is built and loaded correctly.',
          'error',
        );
      }
    } catch (error) {
      console.error('PayTheory initialization error:', error);
      this.updateStatus(`Error: ${error.message}`, 'error');
    }
  }

  updateStatus(message, type = 'info') {
    this.statusEl.textContent = message;
    this.statusEl.className = `status ${type}`;
  }

  showError(message) {
    this.errorDiv.innerHTML = message;
    this.errorDiv.style.display = 'block';
  }

  hideError() {
    this.errorDiv.style.display = 'none';
  }

  showResult(result) {
    this.resultText.textContent = JSON.stringify(result, null, 2);
    this.resultContainer.style.display = 'block';
  }

  hideResult() {
    this.resultContainer.style.display = 'none';
  }

  isCurrentTabValid() {
    const activeTab = window.tabManager ? window.tabManager.getActiveTab() : 'card';
    return this.validationState[activeTab];
  }

  updateButtonStates() {
    const activeTab = window.tabManager ? window.tabManager.getActiveTab() : 'card';
    const isCashTab = activeTab === 'cash';
    const hasConfirmation = this.confirmationState.hasConfirmation;

    // Handle confirmation flow display
    if (hasConfirmation) {
      this.confirmationInitialEl.style.display = 'none';
      this.confirmationActionsEl.style.display = 'flex';
    } else {
      this.confirmationInitialEl.style.display = 'block';
      this.confirmationActionsEl.style.display = 'none';
    }

    // Handle cash tab restrictions
    if (isCashTab) {
      this.paymentWithConfirmationBtn.disabled = true;
      this.tokenizeBtn.style.display = 'none'; // Hide tokenize button entirely
      // Hide confirmation buttons entirely on cash tab
      this.confirmationInitialEl.style.display = 'none';
      this.confirmationActionsEl.style.display = 'none';
    } else {
      // Enable confirmation and tokenization buttons on non-cash tabs
      this.paymentWithConfirmationBtn.disabled = false;
      this.tokenizeBtn.disabled = false;
      this.tokenizeBtn.style.display = 'block'; // Show tokenize button for other tabs
    }
  }

  processTransaction(e) {
    e.preventDefault();
    this.hideError();
    this.hideResult();

    if (!this.isCurrentTabValid()) {
      const activeTab = window.tabManager ? window.tabManager.getActiveTab() : 'card';
      const tabName =
        activeTab === 'card' ? 'Credit Card' : activeTab === 'ach' ? 'ACH/Bank' : 'Cash';
      this.updateStatus(
        `Please fill out all required ${tabName} fields before processing transaction.`,
        'error',
      );
      return;
    }

    // Reset confirmation state when starting new transaction
    this.confirmationState.hasConfirmation = false;
    this.confirmationState.confirmationData = null;
    this.updateButtonStates();

    this.updateStatus('Processing transaction...', 'info');

    paytheory
      .transact(TRANSACTING_PARAMETERS)
      .then(result => this.handleTransactionResult(result))
      .catch(e => this.handleTransactionError(e));
  }

  processTransactionWithConfirmation(e) {
    e.preventDefault();
    this.hideError();
    this.hideResult();

    if (!this.isCurrentTabValid()) {
      const activeTab = window.tabManager ? window.tabManager.getActiveTab() : 'card';
      const tabName =
        activeTab === 'card' ? 'Credit Card' : activeTab === 'ach' ? 'ACH/Bank' : 'Cash';
      this.updateStatus(
        `Please fill out all required ${tabName} fields before processing transaction.`,
        'error',
      );
      return;
    }

    // Reset confirmation state
    this.confirmationState.hasConfirmation = false;
    this.confirmationState.confirmationData = null;
    this.updateButtonStates();

    this.updateStatus('Processing transaction with confirmation...', 'info');

    const transactingParametersWithConfirmation = {
      ...TRANSACTING_PARAMETERS,
      confirmation: true,
    };

    paytheory
      .transact(transactingParametersWithConfirmation)
      .then(result => this.handleTransactionResult(result))
      .catch(e => this.handleTransactionError(e));
  }

  tokenizePaymentMethod(e) {
    e.preventDefault();
    this.hideError();
    this.hideResult();

    if (!this.isCurrentTabValid()) {
      const activeTab = window.tabManager ? window.tabManager.getActiveTab() : 'card';
      const tabName =
        activeTab === 'card' ? 'Credit Card' : activeTab === 'ach' ? 'ACH/Bank' : 'Cash';
      this.updateStatus(
        `Please fill out all required ${tabName} fields before tokenizing.`,
        'error',
      );
      return;
    }

    this.updateStatus('Tokenizing payment method...', 'info');

    paytheory
      .tokenizePaymentMethod(TOKENIZE_PAYMENT_METHOD_PARAMETERS)
      .then(result => {
        console.log('Tokenization result:', result);

        if (result.type === 'TOKENIZED') {
          this.updateStatus('Payment method tokenized successfully!', 'success');
          this.showResult(result.body);
        } else if (result.type === 'ERROR') {
          this.updateStatus(`Tokenization Error: ${result.error}`, 'error');
          this.showResult({ error: result.error });
        }
      })
      .catch(e => {
        this.updateStatus('Tokenization error occurred', 'error');
        console.error('Tokenization error:', e);
        this.showResult(e);
      });
  }

  confirmPayment(e) {
    e.preventDefault();
    this.hideError();
    this.hideResult();

    if (!this.confirmationState.hasConfirmation || !this.confirmationState.confirmationData) {
      this.updateStatus('No confirmation data available', 'error');
      return;
    }

    this.updateStatus('Confirming payment...', 'info');

    paytheory
      .confirm(this.confirmationState.confirmationData)
      .then(result => {
        console.log('Confirmation result:', result);

        // Reset confirmation state
        this.confirmationState.hasConfirmation = false;
        this.confirmationState.confirmationData = null;
        this.updateButtonStates();

        if (result.type === 'SUCCESS') {
          this.updateStatus('Payment confirmed successfully!', 'success');
          this.showResult(result.body);
        } else if (result.type === 'FAILED') {
          this.updateStatus('Payment confirmation failed', 'error');
          this.showResult(result.body);
        } else if (result.type === 'ERROR') {
          this.updateStatus(`Confirmation Error: ${result.error}`, 'error');
          this.showResult({ error: result.error });
        }
      })
      .catch(e => {
        this.updateStatus('Confirmation error occurred', 'error');
        console.error('Confirmation error:', e);
        this.showResult(e);

        // Reset confirmation state on error
        this.confirmationState.hasConfirmation = false;
        this.confirmationState.confirmationData = null;
        this.updateButtonStates();
      });
  }

  cancelPayment(e) {
    e.preventDefault();
    this.hideError();
    this.hideResult();

    if (!this.confirmationState.hasConfirmation || !this.confirmationState.confirmationData) {
      this.updateStatus('No confirmation data available', 'error');
      return;
    }

    this.updateStatus('Cancelling payment...', 'info');

    paytheory
      .cancel(this.confirmationState.confirmationData)
      .then(result => {
        console.log('Cancellation result:', result);

        // Reset confirmation state
        this.confirmationState.hasConfirmation = false;
        this.confirmationState.confirmationData = null;
        this.updateButtonStates();

        if (result.type === 'SUCCESS') {
          this.updateStatus('Payment cancelled successfully', 'success');
          this.showResult(result.body);
        } else if (result.type === 'FAILED') {
          this.updateStatus('Payment cancellation failed', 'error');
          this.showResult(result.body);
        } else if (result.type === 'ERROR') {
          this.updateStatus(`Cancellation Error: ${result.error}`, 'error');
          this.showResult({ error: result.error });
        }
      })
      .catch(e => {
        this.updateStatus('Cancellation error occurred', 'error');
        console.error('Cancellation error:', e);
        this.showResult(e);

        // Reset confirmation state on error
        this.confirmationState.hasConfirmation = false;
        this.confirmationState.confirmationData = null;
        this.updateButtonStates();
      });
  }

  handleTransactionResult(result) {
    console.log('Transaction result:', result);

    if (result.type === 'SUCCESS') {
      this.updateStatus('Transaction successful!', 'success');
      // Reset confirmation state on success
      this.confirmationState.hasConfirmation = false;
      this.confirmationState.confirmationData = null;
      this.updateButtonStates();
      this.showResult(result.body);
    } else if (result.type === 'FAILED') {
      this.updateStatus('Transaction failed', 'error');
      // Reset confirmation state on failure
      this.confirmationState.hasConfirmation = false;
      this.confirmationState.confirmationData = null;
      this.updateButtonStates();
      this.showResult(result.body);
    } else if (result.type === 'ERROR') {
      this.updateStatus(`Payment Error: ${result.error}`, 'error');
      // Reset confirmation state on error
      this.confirmationState.hasConfirmation = false;
      this.confirmationState.confirmationData = null;
      this.updateButtonStates();
      this.showResult({ error: result.error });
    } else if (result.type === 'CONFIRMATION') {
      this.updateStatus(
        'Transaction requires confirmation - use Confirm or Cancel buttons',
        'info',
      );
      console.log('Confirmation required:', result);
      this.confirmationState.hasConfirmation = true;
      this.confirmationState.confirmationData = result;
      this.updateButtonStates();
      this.showResult(result);
    } else if (result.type === 'CASH') {
      this.updateStatus('Cash payment initiated', 'success');
      this.showResult(result.body);
    }
  }

  handleTransactionError(e) {
    this.updateStatus('Transaction error occurred', 'error');
    console.error('Transaction error:', e);
    this.showResult(e);
  }
}
