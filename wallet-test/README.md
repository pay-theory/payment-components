# Wallet Test - Apple Pay & Google Pay

This is a simple test implementation of Apple Pay and Google Pay using the Pay Theory Messenger.

## Setup

1. Build the Pay Theory SDK first:
   ```bash
   npm run build:local
   ```

2. Run the local development server:
   ```bash
   npm run dev:local
   ```

3. Open `http://localhost:8080/wallet-test/` in your browser

## Requirements

### Apple Pay
- Safari browser on macOS or iOS
- Device with Touch ID or Face ID
- Apple Pay configured with valid cards

### Google Pay
- Chrome, Safari, or Firefox browser
- Google account with payment methods

## Configuration

Before testing, you'll need to:

1. Enter your Pay Theory API key in the form
2. Update the Google Pay configuration in `wallet.js`:
   - `merchantId`: Your Google Pay merchant ID
   - `gatewayMerchantId`: Your Pay Theory gateway merchant ID

## How It Works

1. The page checks for wallet availability on load
2. Shows appropriate payment buttons based on device/browser support
3. When clicked:
   - Apple Pay: Requests merchant validation via messenger, then processes payment
   - Google Pay: Shows Google Pay sheet, then processes payment via messenger
4. Uses `PayTheoryMessenger` to handle secure payment processing

## Testing

- Use TEST environment for Google Pay to avoid real charges
- Apple Pay always uses real cards but can be tested with sandbox API keys
- Default amount is $10.00 (1000 cents)