/**
 * Main Application Logic
 * Orchestrates the entire local test application
 */

/* global PaymentFieldsManager, CheckoutComponentsManager */

class LocalTestApp {
  constructor() {
    this.paymentFieldsManager = null;
    this.checkoutComponentsManager = null;
    this.isSDKLoaded = false;
  }

  /**
   * Initialize the application
   */
  init() {
    console.log('🚀 Initializing Local Test Application...');

    // Wait for DOM and PayTheory SDK to be ready
    if (document.readyState === 'loading') {
      window.addEventListener('load', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }

  /**
   * Handle DOM ready event
   */
  onDOMReady() {
    console.log('📄 DOM ready');

    // Initialize managers
    this.paymentFieldsManager = new PaymentFieldsManager();
    this.checkoutComponentsManager = new CheckoutComponentsManager();

    // Make managers globally available
    window.paymentFieldsManager = this.paymentFieldsManager;
    window.checkoutComponentsManager = this.checkoutComponentsManager;

    // Set up tab switching behavior
    this.setupTabSwitching();

    // Initialize PayTheory SDK when available
    this.initializePayTheory();
  }

  /**
   * Set up tab switching behavior
   */
  setupTabSwitching() {
    if (!window.tabManager) {
      console.warn('TabManager not available');
      return;
    }

    // Store original switchTab method
    const originalSwitchTab = window.tabManager.switchTab.bind(window.tabManager);

    // Override switchTab to handle component initialization
    window.tabManager.switchTab = event => {
      const targetTab = event.target.getAttribute('data-tab');
      const previousTab = window.tabManager.getActiveTab();

      console.log(`🔄 Switching from ${previousTab} to ${targetTab}`);

      // Call original switchTab
      originalSwitchTab(event);

      // Handle tab-specific logic
      this.handleTabSwitch(targetTab, previousTab);
    };
  }

  /**
   * Handle tab switching logic
   */
  handleTabSwitch(newTab, previousTab) {
    // Hide errors and results when switching tabs
    this.checkoutComponentsManager.hideErrorAndResult();

    // Initialize components based on new tab
    if (newTab === 'button' || newTab === 'qr') {
      console.log(`🔄 App handling switch to ${newTab} tab, SDK loaded: ${this.isSDKLoaded}`);
      // Initialize checkout components if SDK is loaded
      if (this.isSDKLoaded) {
        this.checkoutComponentsManager.initializeForTab(newTab);
      } else {
        // Update status to show waiting for SDK
        const statusEl = document.getElementById('status');
        if (statusEl) {
          statusEl.textContent = 'Waiting for PayTheory SDK to load...';
          statusEl.className = 'status info';
        }
      }
    } else if (['card', 'ach', 'cash'].includes(newTab)) {
      // Update button states for field-based tabs
      if (this.paymentFieldsManager) {
        this.paymentFieldsManager.updateButtonStates();
      }
    }
  }

  /**
   * Initialize PayTheory SDK
   */
  initializePayTheory() {
    // Check if SDK is already loaded
    if (typeof paytheory !== 'undefined') {
      this.onSDKReady();
      return;
    }

    // Wait for SDK to load
    console.log('⏳ Waiting for PayTheory SDK to load...');

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    const checkSDK = () => {
      attempts++;

      if (typeof paytheory !== 'undefined') {
        console.log('✅ PayTheory SDK loaded');
        this.onSDKReady();
      } else if (attempts < maxAttempts) {
        setTimeout(checkSDK, 100);
      } else {
        console.error('❌ PayTheory SDK failed to load within timeout');
        this.onSDKError(
          'PayTheory SDK failed to load. Check that index.js is built and accessible.',
        );
      }
    };

    checkSDK();
  }

  /**
   * Handle SDK ready event
   */
  onSDKReady() {
    console.log('✅ PayTheory SDK ready');
    this.isSDKLoaded = true;

    // Initialize payment fields for field-based tabs
    // this.paymentFieldsManager.initializePayTheoryFields();

    // Initialize all checkout components on load (hidden initially)
    this.checkoutComponentsManager.initializeAllComponents();

    // Show the component for the currently active tab
    const currentTab = window.tabManager ? window.tabManager.getActiveTab() : 'button';
    if (currentTab === 'button' || currentTab === 'qr') {
      // Add a small delay to ensure components are fully initialized and hidden first
      setTimeout(() => {
        this.checkoutComponentsManager.showComponentForTab(currentTab);
      }, 150);
    }

    // Update status
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = 'PayTheory SDK loaded! Ready to test payment components.';
      statusEl.className = 'status success';
    }
  }

  /**
   * Handle SDK error
   */
  onSDKError(message) {
    console.error('❌ PayTheory SDK error:', message);

    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'status error';
    }
  }
}

// Initialize the application when the script loads
console.log('🔧 Setting up Local Test Application...');
const app = new LocalTestApp();

// Start the application
app.init();

// Make app globally available for debugging
window.localTestApp = app;
