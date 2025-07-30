/**
 * Tab switching functionality
 */

class TabManager {
  constructor() {
    this.activeTab = 'card'; // Default to card to match HTML
    this.init();
  }

  init() {
    console.log('🔧 Setting up tabs...');

    // Get all tabs and tab content
    this.tabs = document.querySelectorAll('.tab');
    this.tabContents = document.querySelectorAll('.tab-content');

    // Find the currently active tab from DOM
    const activeTabElement = document.querySelector('.tab.active');
    if (activeTabElement) {
      this.activeTab = activeTabElement.getAttribute('data-tab');
      console.log('📍 Detected active tab from DOM:', this.activeTab);
    }

    // Add click listeners to tabs
    this.tabs.forEach(tab => {
      tab.addEventListener('click', e => this.switchTab(e));
    });
  }

  switchTab(event) {
    const targetTab = event.target.getAttribute('data-tab');

    // Remove active class from all tabs and content
    this.tabs.forEach(t => t.classList.remove('active'));
    this.tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab and corresponding content
    event.target.classList.add('active');
    document.getElementById(targetTab + '-tab').classList.add('active');

    // Update active tab tracking
    this.activeTab = targetTab;

    // Update body class for styling
    document.body.className = `${targetTab}-tab-active`;

    // Show/hide expanded response toggle based on tab
    const expandedToggle = document.getElementById('expanded-response-toggle');
    if (expandedToggle) {
      // Show toggle only for card, ach, and cash tabs
      if (['card', 'ach', 'cash'].includes(targetTab)) {
        expandedToggle.style.display = 'block';
      } else {
        expandedToggle.style.display = 'none';
      }
    }

    // Update button states when tab changes
    if (window.paymentFieldsManager) {
      window.paymentFieldsManager.updateButtonStates();
    }

    console.log('🔄 Switched to tab:', targetTab);
  }

  getActiveTab() {
    return this.activeTab;
  }

  isFieldBasedTab() {
    return ['card', 'ach', 'cash'].includes(this.activeTab);
  }

  isCheckoutComponentTab() {
    return ['button', 'qr'].includes(this.activeTab);
  }
}

// Initialize tab manager when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  window.tabManager = new TabManager();
});
