# @paytheory/payment-components

> Pay Theory Web SDK

[![NPM](https://img.shields.io/npm/v/@paytheory/payment-components.svg)](https://www.npmjs.com/package/@paytheory/payment-components) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @paytheory/payment-components
```

```javascript
// SDK will be available as paytheory
import * as paytheory from '@paytheory/payment-components'
```

or

```html
<!-- SDK will be available as window.paytheory -->
<script src="https://dev.sdk.paytheorystudy.com"></script>
```

## Usage

First create the container for the credit card input

```html
<div id="paytheory-credit-card" />
```

Then create the credit card field and establish callbacks

```javascript
const paytheorySDK = window.paytheory ? window.paytheory : paytheory

paytheorySDK.createCreditCard(API_KEY, CLIENT_ID, AMOUNT)
    .then(creditCardEntry => {
        
        // mount the hosted fields into the container
        creditCardEntry.mount()
        
        // handle callbacks
        creditCardEntry.readyObserver((ready) => {
            // ready is a boolean indictor
            // fires once when SDK is loaded and ready
        })
        creditCardEntry.transactedObserver((transactionResult) => {
            // results of the transaction
            // fires once when transaction is completed
        })
        creditCardEntry.validObserver((validation) => {
            // valid is a boolean indictor
            // fires every time the valid state of the hosted field changes
        })
        creditCardEntry.errorObserver((error) => {
            // error is false or a message
            // fires every time the error state/message changes
        })            
    })
```

When ready submit the transaction 

```javascript
// optionally provide custom tags to help track purchases
const TAGS = { YOUR_TAG_KEY: 'YOUR_TAG_VALUE' }

// optionally provide details about the buyer
const BUYER_OPTIONS = {
    "first_name": "Some",
    "last_name": "Body",
    "email": "somebody@gmail.com",
    "phone": "3335554444",
    "personal_address": {
        "city": "Somewhere",
        "country": "USA",
        "region": "OH",
        "line1": "123 Street St",
        "line2": "Apartment 17",
        "postal_code": "12345"
    }
    
// begin the transaction authorization    
paytheorySDK.initCreditCardTransaction(API_KEY, CLIENT_ID, TAGS, BUYER_OPTIONS)
```

Upon completion of authorization and capture the following details are returned

```json
{
        "last_four": "4242", 
        "brand": "VISA",
        "payment-detail-reference": "authorization id",
        "payment-source-id": "payment instrument id",
        "payment-application-id": "application environment id",
        "state": "XX",
        "amount": 100,
        "currency": "USD",
        "tags": { "YOUR_TAG_KEY": "YOUR TAG VALUE"},
        "created_at": "2020-06-30T03:08:27.24Z",
        "updated_at": "2020-06-30T03:08:27.24Z",
}
```


## License

MIT © [aron23](https://github.com/aron23)
