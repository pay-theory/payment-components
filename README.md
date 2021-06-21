[partner]: michigancity
[stage]: paytheorylab
[test]: "https://michigancity.sdk.paytheorylab.com"
# Pay Theory Web SDK

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d446eeab0c444274bfa00aceca3f0875)](https://www.codacy.com/gh/pay-theory/payment-components?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=pay-theory/payment-components&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/d446eeab0c444274bfa00aceca3f0875)](https://www.codacy.com/gh/pay-theory/payment-components/dashboard?utm_source=github.com&utm_medium=referral&utm_content=pay-theory/payment-components&utm_campaign=Badge_Coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/pay-theory/payment-components/badge.svg?targetFile=package.json)](https://snyk.io/test/github/pay-theory/payment-components?targetFile=package.json)
[![NPM](https://img.shields.io/npm/v/@paytheory/payment-components.svg)](https://www.npmjs.com/package/@paytheory/payment-components)

## Live Install

```bash
npm install --save @paytheory/payment-components
```

## Sandbox Install

```bash
npm install --save @paytheory/payment-components@sandbox
```

## Live Import

```javascript
import '@paytheory/payment-components'
```

or

```html
<script src=[test]></script>
```

## Sandbox Import

```javascript
import '@paytheory/payment-components@sandbox'
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

There are ten Card and four ACH components available to use for payments.

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

-   Credit Card Number Component
-   Credit Card Expiration Component
-   Credit Card CVV Component

### Credit Card Number, Expiration and CVV Components

These components will provide a full payment implementation.

[codesandbox credit card components example](https://codesandbox.io/s/sdk-payment-example-individual-cw5c0)

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

[codesandbox credit card address fields example](https://codesandbox.io/s/sdk-payment-example-with-address-543xy)

Six optional components are available to capture additional details about the card:

-   Credit Card Account Name Component
-   Credit Card Address Line 1 Component
-   Credit Card Address Line 2 Component
-   Credit Card City Component
-   Credit Card State Component
-   Credit Card Zip Code Component

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

### ACH Account Number, Bank Code, Name, and Account Type Components

These components will provide a full payment implementation.

These components must be combined in a form to enable ACH payment:

-   ACH Account Name Component
-   ACH Account Type Component
-   ACH Account Number Component
-   ACH Bank Code Component

A container is required for each component:

```html
<form>
...
<div id="pay-theory-ach-account-name"></div>
<div id="pay-theory-ach-account-type"></div>
<div id="pay-theory-ach-account-number"></div>
<div id="pay-theory-ach-bank-code"></div>
...
</form>
```

## Card and ACH components on the same page

To display both Card and ACH on the same page make sure only one is visible at a time and the other is wrapped by a parent element whose CSS is set to ``` display:none ```

## Styling the container

To style the input container simply provide your own CSS for the pay theory containers you create.

*Individual pay-theory-credit-card-number containers should be at least 340px wide, pay-theory-credit-card combined input should be 400px*

```css
#pay-theory-credit-card-number,
#pay-theory-credit-card-exp,
#pay-theory-credit-card-cvv {
  height: 1.75em;
  border: solid 1px #ccc;
  border-radius: 5px;
  margin: 4px 0;
}
```

## Handle state with callbacks

Mount to create the credit card field(s) and establish callbacks:

```javascript

// API KEY is required
const API_KEY = 'your-api-key'

// optionally define custom styles for the input components text
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
/**
* optionally set the fee mode
* by default SURCHARGE mode is used
* SERVICE_FEE mode is available only when enabled by Pay Theory
* SURCHARGE mode applies a fee of 2.9% + $0.30
* to be deducted from original amount
* SERVICE FEE mode calculates a fee based on predetermined parameters
* and adds it to the original amount
**/
const FEE_MODE = window.paytheory.SURCHARGE

// create a place to store the credit card
let myCreditCard

(async() => {
    /**
    * initialize the SDK (can also be called as a promise)
    *
    * if providing tags but no styles, provide an empty object
    * as a placeholder
    **/

    myCreditCard = await window.paytheory.create(
        API_KEY,
        STYLES,
        TAGS,
        FEE_MODE)

    // mount the hosted fields into the container
    myCreditCard.mount()

    // handle callbacks
    myCreditCard.readyObserver(ready => {
        /**
        * ready is a boolean indicator
        * fires when SDK is loaded and ready
        * this is where you would associate any listeners
        * to trigger initTransaction
        * or optionally confirmation
        **/
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
        * valid is a boolean indicator
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

Once the transaction has ended in either success or failure the buyer should be
directed to a results page.

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
 * use the tokenObserver to handle confirmation step
 **/
myCreditCard.tokenizeObserver((card) => {
    const confirmation =  `Are you sure you want to make a payment on ${card.brand} card beginning with ${card.first_six}`
    if (confirm(confirmation)) {
      myCreditCard.confirm();
    } else {
      myCreditCard.cancel();
    }
});


/**
 * use the ready observer from above to apply listeners
 * provide your own component IDs
 **/
myCreditCard.readyObserver(ready => {
    ...
    document
        .getComponentById("initiate-payment-button-id")
        .addEventListener("click", clickListener)
    ...
})

```

## Tokenization response

When the confirm option of initTransaction is set to true, the payment card token details are returned in tokenizeObserver

*note that the service fee is included in amount*

```json
{
	"first_six": "XXXXXX",
	"brand": "XXXX",
	"receipt_number": "pt-dev-XXXXXX",
	"amount": 999,
	"service_fee": 195
}
```

## Completion response

Upon completion of authorization and capture, details similar to the following are returned:

*note that the service fee is included in amount*

```json
{
    "receipt_number":"pt-env-XXXXXX",
    "last_four": "XXXX",
    "brand": "XXXXXXXXX",
    "created_at":"YYYY-MM-DDTHH:MM:SS.ssZ",
    "amount": 999,
    "service_fee": 195,
    "state":"SUCCEEDED",
    "tags":{ "pay-theory-environment":"env","pt-number":"pt-env-XXXXXX", "YOUR_TAG_KEY": "YOUR_TAG_VALUE" }
}
```

If a failure or decline occurs during the transaction, the response will be similar to the following:

```json
{
    "receipt_number":"pt-test-XXXXXX",
    "last_four":"XXXX",
    "brand":"VISA",
    "state":"FAILURE",
    "type":"some descriptive reason for the failure / decline"
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

    <!-- for sandbox -->
    <script src="https://stage.sdk.paytheorystudy.com"></script>

    <!-- for live -->
    <script src="https://sdk.paytheory.com"></script>

</head>
```

## Deprecations

The createPaymentFields initializing function has been replaced with create. The create function no longer requires a clientID to be passed and allows you to set a feeMode.

## License

MIT © [pay theory](https://github.com/pay-theory)
