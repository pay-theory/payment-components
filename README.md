# @paytheory/payment-components

# Pay Theory Web SDK

[![NPM](https://img.shields.io/npm/v/@paytheory/payment-components.svg)](https://www.npmjs.com/package/@paytheory/payment-components) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @paytheory/payment-components
```

## Import

```javascript
// SDK will be available as paytheory
import * as paytheory from '@paytheory/payment-components'
```

or

```html
<!-- SDK will be available as window.paytheory -->
<script src="https://demo.sdk.paytheorystudy.com"></script>
```

## Usage

### Single Element
[codesandbox example](https://duckduckgo.com)

First create the container for the credit card input

```html
<div id="paytheory-credit-card" />
```

### Multiple Element

First create the container for the inputs you want to include

```html
<form>
...
<div id="pay-theory-credit-card-account-name" />
<div id="pay-theory-credit-card-number" />
<div id="pay-theory-credit-card-cvv" />
<div id="pay-theory-credit-card-expiration" />
<div id="pay-theory-credit-card-zip" />
...
</form>
```

## Handle state with callbacks

Mount to create the credit card field(s) and establish callbacks

```javascript
/* 
*  if you imported from CDN the library is available at
*  window.paytheory, otherwise  if you imported as a module 
*  the library is as named
*/
let paytheorySDK = window.paytheory ? window.paytheory : paytheory

// API KEY and CLIENT ID are required
const API_KEY = 'your-api-key'
const CLIENT_ID = 'your-client-id'

// optionally define custom styles for the input elements
const STYLES = {
    default: {
        color: 'black',
        fontSize: '14px'
    },
    success: {
        color: '#5cb85c',
        fontSize: '14px'
    },
    error: {
        color: '#d9534f',
        fontSize: '14px'
    }
}

// optionally provide custom tags to help track purchases
const TAGS = { YOUR_TAG_KEY: 'YOUR_TAG_VALUE' }

// create a place to store the credit card
let myCreditCard

// initialize the SDK (can also be called with await)
paytheorySDK
        .createCreditCard(
            API_KEY, 
            CLIENT_ID, 
            AMOUNT, 
            STYLES, 
            TAGS)
        .then(creditCardEntry => {
            
            // store credit card entry so we can use it for a transaction
            myCreditCard = creditCardEntry
            
            // mount the hosted fields into the container
            myCreditCard.mount()
            
            // handle callbacks
            myCreditCard.readyObserver(ready => {
                // ready is a boolean indictor
                // fires once when SDK is loaded and ready
            })
            myCreditCard.transactedObserver(transactionResult => {
                // results of the transaction
                // fires once when transaction is completed
            })
            myCreditCard.validObserver(valid => {
                // valid is a boolean indictor
                // fires every time the valid state of the hosted field changes
            })
            myCreditCard.errorObserver(error => {
                // error is false or a message
                // fires every time the error state/message changes
            })             
        })
```

## Initiate the transaction

When ready submit the transaction using the saved credit card

```javascript
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
    
// begin the transaction authorization using saved credit card entry
myCreditCard.initTransaction(BUYER_OPTIONS)
```

## Completion response

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

MIT © [pay theory](https://github.com/pay-theory)

