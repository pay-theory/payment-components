# @paytheory/payment-components

> Pay Theory Web SDK

[![NPM](https://img.shields.io/npm/v/@paytheory/payment-components.svg)](https://www.npmjs.com/package/@paytheory/payment-components) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @paytheory/payments @paytheory/tags react react-dom
```

or

```html
<script src="https://dev.sdk.paytheorystudy.com"></script>
```

## Usage

First create the container for the credit card input

```html
<div id="paytheory-credit-card" />
```

Then create the credit card field and establish callbacks

```javascript
window.paytheory.createCreditCard(API_KEY, CLIENT_ID, AMOUNT)
    .then(creditCardEntry => {
        creditCardEntry.readyObserver((ready) => {
            // ready is a boolean indictor
        })
        creditCardEntry.transactedObserver((transactionResult) => {
            // results of the transaction
        })
        creditCardEntry.validObserver((validation) => {
            // valid is a boolean indictor
        })
        creditCardEntry.errorObserver((error) => {
            // error is false or a message
        })        
        creditCardEntry.mount()
    })
```

When ready submit the transaction 

```javascript
window.paytheory.initCreditCardTransaction(API_KEY, CLIENT_ID, TAGS, BUYER_OPTIONS)
```


## License

MIT © [aron23](https://github.com/aron23)
