/**
 * Checkout Components Management
 * Handles Button and QR checkout components
 */

/* global paytheory, API_KEY, CHECKOUT_DETAILS, initializeFeeMode */

class CheckoutComponentsManager {
  constructor() {
    this.buttonInitialized = false;
    this.qrInitialized = false;
    this.buttonContainer = null;
    this.qrContainer = null;
  }

  /**
   * Initialize Checkout Button component
   */
  initializeCheckoutButton() {
    console.log('🔵 Initializing Checkout Button...');

    if (typeof paytheory === 'undefined' || typeof paytheory.button === 'undefined') {
      console.error('PayTheory SDK or button method not available');
      return;
    }

    // Set flag immediately to prevent duplicate initialization
    this.buttonInitialized = true;

    try {
      // Initialize fee mode
      initializeFeeMode();

      paytheory.button({
        apiKey: API_KEY,
        checkoutDetails: CHECKOUT_DETAILS,
        onReady: isReady => {
          console.log('✅ Checkout Button ready:', isReady);
          this.updateButtonStatus(
            'Checkout Button ready! Click to open hosted checkout.',
            'success',
          );
        },
        onClick: () => {
          console.log('🖱️ Checkout Button clicked');
          this.updateButtonStatus('Opening hosted checkout...', 'info');
        },
        onSuccess: result => {
          console.log('✅ Checkout Button success:', result);
          this.updateButtonStatus('Checkout completed successfully!', 'success');
          this.showResult(result);
        },
        onError: error => {
          console.error('❌ Checkout Button error:', error);
          this.updateButtonStatus(`Checkout Error: ${error}`, 'error');
          this.showError(error);
          // Reset flag on error so user can retry
          this.buttonInitialized = false;
        },
        onCancel: () => {
          console.log('❌ Checkout Button cancelled');
          this.updateButtonStatus('Checkout cancelled by user', 'info');
        },
        onBarcode: barcodeData => {
          console.log('📱 Checkout Button barcode:', barcodeData);
          this.updateButtonStatus('Barcode generated for cash payment', 'success');
          this.showResult(barcodeData);
        },
      });

      this.updateButtonStatus('Pre-initializing Checkout Button (hidden)...', 'info');
    } catch (error) {
      console.error('Error initializing Checkout Button:', error);
      this.updateButtonStatus(`Checkout Button Error: ${error.message}`, 'error');
      // Reset flag on error so user can retry
      this.buttonInitialized = false;
    }
  }

  /**
   * Initialize QR Code component
   */
  initializeCheckoutQR() {
    console.log('📱 Initializing QR Code...');

    if (typeof paytheory === 'undefined' || typeof paytheory.qrCode === 'undefined') {
      console.error('PayTheory SDK or qrCode method not available');
      return;
    }

    // Set flag immediately to prevent duplicate initialization
    this.qrInitialized = true;

    try {
      // Initialize fee mode
      initializeFeeMode();

      paytheory.qrCode({
        apiKey: API_KEY,
        size: 200, // QR code size in pixels
        checkoutDetails: CHECKOUT_DETAILS,
        onReady: isReady => {
          console.log('✅ QR Code ready:', isReady);
          this.updateQRStatus('QR Code ready! Scan with your mobile device.', 'success');
        },
        onSuccess: result => {
          console.log('✅ QR Code success:', result);
          this.updateQRStatus('QR Code payment completed successfully!', 'success');
          this.showResult(result);
        },
        onError: error => {
          console.error('❌ QR Code error:', error);
          this.updateQRStatus(`QR Code Error: ${error}`, 'error');
          this.showError(error);
          // Reset flag on error so user can retry
          this.qrInitialized = false;
        },
      });

      this.updateQRStatus('Pre-initializing QR Code (hidden)...', 'info');
    } catch (error) {
      console.error('Error initializing QR Code:', error);
      this.updateQRStatus(`QR Code Error: ${error.message}`, 'error');
      // Reset flag on error so user can retry
      this.qrInitialized = false;
    }
  }

  /**
   * Initialize all checkout components on page load (hidden)
   */
  initializeAllComponents() {
    console.log('🔄 Pre-initializing all checkout components...');

    if (typeof paytheory === 'undefined') {
      console.log('PayTheory object not available');
      return;
    }

    // Initialize both components but keep them hidden
    if (!this.buttonInitialized) {
      // this.initializeCheckoutButton();
    }

    if (!this.qrInitialized) {
      this.initializeCheckoutQR();
    }

    // Hide both containers initially (with small delay to ensure components are rendered)
    setTimeout(() => {
      this.hideAllComponents();
    }, 100);
  }

  /**
   * Hide all checkout components
   */
  hideAllComponents() {
    // Find and hide button container
    this.buttonContainer = document.querySelector('#pay-theory-checkout-button');
    if (this.buttonContainer) {
      this.buttonContainer.style.display = 'none';
      console.log('🔵 Button container hidden');
    }

    // Find and hide QR container
    this.qrContainer = document.querySelector('#pay-theory-checkout-qr');
    if (this.qrContainer) {
      this.qrContainer.style.display = 'none';
      console.log('📱 QR container hidden');
    }
  }

  /**
   * Show component for active tab
   */
  showComponentForTab(tabName) {
    console.log(`👁️ Showing component for tab: ${tabName}`);

    // Hide all components first
    this.hideAllComponents();

    // Show the component for the active tab
    if (tabName === 'button' && this.buttonContainer) {
      this.buttonContainer.style.display = 'block';
      console.log('🔵 Button container shown');
    } else if (tabName === 'qr' && this.qrContainer) {
      this.qrContainer.style.display = 'block';
      console.log('📱 QR container shown');
    }
  }

  /**
   * Initialize checkout components based on active tab (now just shows/hides)
   */
  initializeForTab(tabName) {
    console.log(`🔄 Handling tab switch to: ${tabName}`);

    if (tabName === 'button' || tabName === 'qr') {
      // Components should already be initialized, just show the right one
      this.showComponentForTab(tabName);
    }
  }

  /**
   * Clean up components when switching away
   */
  cleanup() {
    // Reset initialization flags if needed
    // this.buttonInitialized = false;
    // this.qrInitialized = false;
  }

  /**
   * Update status for button tab
   */
  updateButtonStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (statusEl && window.tabManager && window.tabManager.getActiveTab() === 'button') {
      statusEl.textContent = message;
      statusEl.className = `status ${type}`;
    }
  }

  /**
   * Update status for QR tab
   */
  updateQRStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (statusEl && window.tabManager && window.tabManager.getActiveTab() === 'qr') {
      statusEl.textContent = message;
      statusEl.className = `status ${type}`;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.innerHTML = message;
      errorDiv.style.display = 'block';
    }
  }

  /**
   * Show result
   */
  showResult(result) {
    const resultContainer = document.getElementById('result-container');
    const resultText = document.getElementById('result-text');

    if (resultContainer && resultText) {
      resultText.textContent = JSON.stringify(result, null, 2);
      resultContainer.style.display = 'block';
    }
  }

  /**
   * Hide error and result when switching tabs
   */
  hideErrorAndResult() {
    const errorDiv = document.getElementById('error');
    const resultContainer = document.getElementById('result-container');

    if (errorDiv) {
      errorDiv.style.display = 'none';
    }

    if (resultContainer) {
      resultContainer.style.display = 'none';
    }
  }
}
