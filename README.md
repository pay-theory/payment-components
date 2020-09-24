# Pay Theory Web SDK

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d446eeab0c444274bfa00aceca3f0875)](https://www.codacy.com/gh/pay-theory/payment-components?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=pay-theory/payment-components&amp;utm_campaign=Badge_Grade) [![Known Vulnerabilities](https://snyk.io/test/github/pay-theory/payment-components/badge.svg?targetFile=package.json)](https://snyk.io/test/github/pay-theory/payment-components?targetFile=package.json) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![NPM](https://img.shields.io/npm/v/@paytheory/payment-components.svg)](https://www.npmjs.com/package/@paytheory/payment-components)

## Install

```bash
npm install --save @paytheory/payment-components@beta
```

## Import

```javascript
import '@paytheory/payment-components@beta'
```

or

```html
<script src="https://stage.sdk.paytheorystudy.com"></script>
```

either way the SDK will be exposed as

```javascript
window.paytheory
```

## Usage

There are ten components available to use for payments.

### Credit Card Component

This component will provide a full payment implementation.

[codesandbox credit card component example](https://codesandbox.io/s/sdk-payment-example-solok)

Credit Card Component provides a single form entry combining:

-   credit card number
-   credit card CVV security code
-   credit card expiration date

Credit Card Component requires a container for the credit card input:

```html
<form>
...
<div id="pay-theory-credit-card"></div>
...
</form>
```

Credit Card Component cannot be used in combination with: 

-   Credit Card Expiration Component 
-   Credit Card CVV Component
   
### Credit Card Number, Expiration and CVV Components

These components will provide a full payment implementation.

[codesandbox credit card component example](https://codesandbox.io/s/sdk-payment-example-solok)

These components must be combined in a form to enable payment:

-   Credit Card Number Component
-   Credit Card CVV Component
-   Credit Card Expiration Component

A container is required for each component:

```html
<form>
...
<div id="pay-theory-credit-card-number"></div>
<div id="pay-theory-credit-card-exp"></div>
<div id="pay-theory-credit-card-cvv"></div>
...
</form>
```

These components cannot be used in combination with: 

-   Credit Card Component

### Credit Card Account Name & Address Components

[codesandbox credit card optional fields example](https://codesandbox.io/s/sdk-payment-example-with-optional-cw5c0)

Six optional components are available to capture additional details about the card:

-   credit card account name
-   credit card address line 1
-   credit card address line 2
-   credit card city
-   credit card state
-   credit card zip code

These entries can be placed wherever you prefer in relation to the other credit card component(s).

Include a container for each of the optional inputs you wish to use:

```html
<form>
...
<div id="pay-theory-credit-card-account-name"></div>
...
<div id="pay-theory-credit-card-address-1"></div>
<div id="pay-theory-credit-card-address-2"></div>
<div id="pay-theory-credit-card-city"></div>
<div id="pay-theory-credit-card-state"></div>
<div id="pay-theory-credit-card-zip"></div>
...
</form>
```

## Handle state with callbacks

Mount to create the credit card field(s) and establish callbacks:

```javascript

// API KEY and CLIENT ID are required
const API_KEY = 'your-api-key'
const CLIENT_ID = 'your-client-id'

// optionally define custom styles for the input components
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

(async() => {
    /*
    * initialize the SDK (can also be called as a promise)
    *
    * if providing tags but no styles, provide an empty object
    * as a placeholder
    */

    myCreditCard = await window.paytheory.createPaymentFields(
        API_KEY,
        CLIENT_ID,
        STYLES,
        TAGS)

    // mount the hosted fields into the container
    myCreditCard.mount()

    // handle callbacks
    myCreditCard.readyObserver(ready => {
        // ready is a boolean indictor
        // fires when SDK is loaded and ready
        // this is where you would associate any listeners
        // to trigger initTransaction
        // or optionally confirmation
    })

    // only needed when REQUIRE_CONFIRMATION is true
    myCreditCard.tokenizeObserver(tokenized => {
        /**
        * results of the payment card tokenization
        * fires once when tokenization is completed
        * this is a good place to enable confirmation
        **/
    })
    
    // only needed when REQUIRE_CONFIRMATION is true
    myCreditCard.captureObserver(transactionResult => {
        /**
        * results of the transaction with confirmation
        * fires once when capture is completed
        **/
    })    

    // only needed when REQUIRE_CONFIRMATION is false
    myCreditCard.transactedObserver(transactionResult => {
        /**
        * results of the transaction without confirmation
        * fires once when transaction is completed
        **/
    })

    myCreditCard.validObserver(valid => {
        /**
        * valid is a boolean indictor
        * fires every time the valid state of the hosted field changes
        * when valid is true is a good time to enable initTransaction
        **/
    })

    myCreditCard.errorObserver(error => {
        /**
        * error is false or a message
        * fires every time the error state/message changes
        **/
    })

})()

```

## Initiate the transaction

When ready submit the transaction using the saved credit card:

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


// optional parameter to require confimation step
const REQUIRE_CONFIRMATION = true

/**
 * create a listener that will trigger the payment process
 * if REQUIRE_CONFIRMATION is true 
 * this step will only complete tokenization
 * otherwise tokenization and capture observers are bypassed
 **/
const clickListener = (e) => {
    e.preventDefault()
    ...
    /** 
     * begin the transaction authorization by providing an amount 
     * and optionally details about the buyer and a flag for confirmation
     * amount must be a positive integer or an error will be thrown
     * */    
    myCreditCard.initTransaction(
      AMOUNT,
      BUYER_OPTIONS,
      REQUIRE_CONFIRMATION // defaults to false
    )
}

/**
 * optional
 * create a listener that will trigger the payment process
 * that follows tokenization
 **/
const confirmListener = (e) => {
    e.preventDefault()
    myCreditCard.confirm()
}   


/**
 * use the ready observer from above to apply listeners
 * provide your own component IDs
 **/
myCreditCard.readyObserver(ready => {
    ...
    document
        .getComponentById("initiate-payment-button-id")
        .addEventListener("click", clickListener)
    document
        .getComponentById("confirm-payment-button-id")
        .addEventListener("click", confirmListener)
    ...
})

```

## Tokenization response

When the confirm option of initTransaction is set to true, the payment card token details are returned in tokenizeObserver

```json
{
    "instrument":"PIXXXXXXXXXXX",
    "last_four":"9999",
    "brand":"CARD_BRAND",
    "idempotencyId": "pt-env-XXXXXXX",
    "identityToken":"xXXXXXX",
    "amount":999
}
```

## Completion response

Upon completion of authorization and capture, details similar to the following are returned:

```json
{
    "receipt_number":"pt-env-XXXXXX",
    "created_at":"YYYY-MM-DDTHH:MM:SS.ssZ",
    "amount":100,
    "state":"SUCCEEDED",
    "tags":{ "pay-theory-environment":"env","pt-number":"pt-env-XXXXXX", "YOUR_TAG_KEY": "YOUR_TAG_VALUE" }
}
```
If an error occurs during the transaction, the response will be similar to the following:

```json
{
    "receipt_number":"pt-test-000002",
    "last_four":"4242",
    "brand":"VISA",
    "state":"error",
    "type":"some descriptive reason for the error"
}
```

## Polyfill and IE 11

To enable IE 11 support you must include the following in your HTML head:

```html
<head>
    <!--
        you can find the latest versions of these at the following links
        https://cdnjs.com/libraries/webcomponentsjs
        https://cdnjs.com/libraries/core-js
    -->

    <!-- begin polyfill -->
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/core-js/3.6.5/minified.js"
      integrity="sha512-il4gs09hawMRQdgVPe9NUODC2gBmQ3lX15lMK1y/WWAkfRRd94yET47NgghJZBSJcPW6ZrqyIziQIT6dI7I3KA=="
      crossorigin="anonymous"
    ></script>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/2.4.4/webcomponents-bundle.js"
      integrity="sha512-bZ7i/n59i3BPUaM+5s7WiMcE3tlVqk9HV4GrpcFfWWhsCYtZa+0MZ4LXl2zhjBsmNGmOOVbjk8WvSNa4wdxYNg=="
      crossorigin="anonymous"
    ></script>
    <!-- end polyfill -->

    <script src="https://stage.sdk.paytheorystudy.com"></script>

</head>
```

## License

MIT © [pay theory](https://github.com/pay-theory)
