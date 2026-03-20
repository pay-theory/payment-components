# Local Test Setup

This is a modular, organized version of the local development test suite, split from the original large `test-local.html` file into manageable components.

## File Structure

```
local-test/
├── index.html              # Main HTML structure
├── styles.css              # All CSS styles
├── config.js               # Configuration constants
├── tabs.js                 # Tab switching functionality
├── payment-fields.js       # Payment fields management (Card/ACH/Cash)
├── checkout-components.js  # Checkout Button & QR Code management
├── app.js                  # Main application orchestration
└── README.md              # This file
```

## Features

### Payment Methods

- **Credit Card Fields** - Individual fields for card number, expiration, CVV, and billing info
- **ACH/Bank Fields** - Account name, number, routing, and account type
- **Cash Fields** - Name and contact information
- **Checkout Button** - Hosted checkout experience in popup window
- **QR Code** - Mobile checkout via QR code scanning

### Functionality

- **Field Validation** - Real-time validation of payment fields
- **Transaction Processing** - Standard and confirmation-based transactions
- **Tokenization** - Payment method tokenization
- **Error Handling** - Comprehensive error display and handling
- **Responsive Design** - Mobile-friendly layout

## Usage

1. **Start Development Servers**

   ```bash
   # Payment Components (parent SDK) - localhost:3000
   npm start

   # Secure Tags Lib (iframe fields) - https://localhost:3001
   npm run dev:local
   ```

2. **Open Test Page**

   ```
   http://localhost:3000/local-test/
   ```

3. **Select Payment Method**
   - Use tabs to switch between different payment methods
   - Fill out required fields for field-based methods
   - Click buttons for hosted checkout methods

## Configuration

Edit `config.js` to customize:

- **API_KEY** - Your PayTheory API key
- **AMOUNT** - Transaction amount (in cents)
- **Test Data** - Payor and billing information
- **Checkout Details** - Button and QR configuration

## Architecture

### Modular Design

- **Separation of Concerns** - Each file handles specific functionality
- **Class-Based Components** - Easy to maintain and extend
- **Event-Driven** - Components communicate through events and callbacks

### Tab Management

- **TabManager** - Handles tab switching and active state
- **Dynamic Initialization** - Components initialize only when needed
- **State Management** - Validation and confirmation states preserved

### Payment Processing

- **PaymentFieldsManager** - Handles Card/ACH/Cash transactions
- **CheckoutComponentsManager** - Handles Button/QR components
- **LocalTestApp** - Orchestrates all components

## Development

### Adding New Payment Methods

1. Add new tab in `index.html`
2. Add tab content structure
3. Update `TabManager.isFieldBasedTab()` or `isCheckoutComponentTab()`
4. Add initialization logic in appropriate manager

### Customizing Styles

- Edit `styles.css` for visual changes
- Use CSS classes for consistent styling
- Responsive design considerations included

### Debugging

- Console logging for all major events
- Global access to managers via `window`
- Structured error handling and display

## Benefits Over Original

### Maintainability

- **Single Responsibility** - Each file has one clear purpose
- **Readable Code** - Smaller, focused files
- **Easy Updates** - Change one aspect without affecting others

### Extensibility

- **Add New Methods** - Simple to add new payment methods
- **Custom Styling** - Separate CSS for easy theming
- **Configuration** - Centralized config management

### Development Experience

- **Better Organization** - Find code quickly
- **Debugging** - Isolated functionality easier to debug
- **Collaboration** - Multiple developers can work on different files

## Migration from Original

The original `test-local.html` (829 lines) has been split into:

- **index.html** (176 lines) - Structure only
- **styles.css** (178 lines) - Styles only
- **config.js** (55 lines) - Configuration only
- **tabs.js** (58 lines) - Tab functionality only
- **payment-fields.js** (287 lines) - Payment fields logic
- **checkout-components.js** (159 lines) - Checkout components logic
- **app.js** (142 lines) - Application orchestration

**Total: ~1055 lines** (vs 829 lines) but much more organized and maintainable.
