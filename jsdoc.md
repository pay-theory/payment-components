# Automated Documentation with JSDoc

## Installation

Install jsdoc and better-docs using npm:

```bash
npm install
```

## How to Add JSDoc Annotations to Documentation

JSDoc annotations are written as specially formatted comments preceding the code they document. They begin with `/**` and end with `*/`, with an asterisk `*` at the beginning of each line within the comment block.

```javascript
/**
 * The create function is used to initialize the Pay Theory object. This function takes two arguments, the API key and the styles object.
 *
 * @param {string} apiKey - A Pay Theory Api Key.
 * @param {Object[]} styles - A custom style JSON object that allows you to customize text and Pay Theory fields.
 * @param {Object[]} metadata - A custom defined JSON object to be stored with the transaction.
 * @param {FeeMode} feeMode - The fee mode on the transaction. SERVICE_FEE charges the fees to the payor. MERCHANT_FEE charges the fees to the merchant.
 * @returns {Promise} This function returns a promise that resolves to the Pay Theory object containing functions and available Event Listeners.
 *
 * @example
 * // Usage example
 * const API_KEY = "YOUR_API_KEY"
 * const STYLES = {
 *     ...style_options
 * }
 *
 * const myPayTheory = await window.paytheory.create(API_KEY, STYLES)
 */
const create = (apiKey, styles, metadata, feeMode) => createPaymentFieldsLegacy(apiKey, undefined, styles, metadata, feeMode);
```

## Generating Documentation

After installation run the following command:

```bash
npm run docs
```

Documentation will be generated in the `docs` folder.