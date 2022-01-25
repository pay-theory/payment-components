# Pay Theory Web SDK

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d446eeab0c444274bfa00aceca3f0875)](https://www.codacy.com/gh/pay-theory/payment-components?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=pay-theory/payment-components&amp;utm_campaign=Badge_Grade) 
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/d446eeab0c444274bfa00aceca3f0875)](https://www.codacy.com/gh/pay-theory/payment-components/dashboard?utm_source=github.com&utm_medium=referral&utm_content=pay-theory/payment-components&utm_campaign=Badge_Coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/pay-theory/payment-components/badge.svg?targetFile=package.json)](https://snyk.io/test/github/pay-theory/payment-components?targetFile=package.json) 
[![NPM](https://img.shields.io/npm/v/@paytheory/payment-components.svg)](https://www.npmjs.com/package/@paytheory/payment-components)

## Import

```html
<script src="https://PARTNER.sdk.STAGE.com/index.js"></script>
```

the SDK will be exposed as

```javascript
window.paytheory
```

## Usage

There are ten Card, four ACH, and two Cash components available to use for payments.

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
<div id="pay-theory-ach-routing-number"></div>
...
</form>
```
### Cash Name and Cash Contact Components

These components will provide all info needed to generate cash barcodes.

These components must be combined in a form to enable Cash payments:

-   Cash Name Component
-   Cash Contact Component

A container is required for each component:

```html
<form>
...
<div id="pay-theory-cash-name"></div>
<div id="pay-theory-cash-contact"></div>
...
</form>
```
## Card, ACH, or Cash components on the same page

To display Card, Cash and/or ACH on the same page make sure only one is visible at a time and the others are wrapped by a parent element whose CSS is set to ``` display:none ```

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

## Custom Tags

To track payments with custom tags simply add the following when initializing the SDK:

-   **pay-theory-account-code**: Code that will be used to track the payment.
-   **pay-theory-reference**: Custom description assigned to a payment that can later be filtered by.

To manage payments with custom tags simply add the following when initializing the SDK:

-   **payment-parameters-name**: The payment parameters to use for the payment.


```javascript
const TAGS = {
        "pay-theory-account-code": "code-123456789",
        "pay-theory-reference": "field-trip",
        "payment-parameters-name": "expires-in-30-days"
      };
```

## Handle state with callbacks

Mount to create the credit card, ACH, and/or cash field(s) and establish callbacks:

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
const TAGS = {
        "pay-theory-account-code": "code-123456789",
        "pay-theory-reference": "field-trip",
        "payment-parameters-name": "expires-in-30-days"
      };
/**
* optionally set the fee mode for Card and ACH
* by default SURCHARGE mode is used
* SERVICE_FEE mode is available only when enabled by Pay Theory
* SURCHARGE mode applies a fee of 2.9% + $0.30 
* to be deducted from original amount
* SERVICE FEE mode calculates a fee based on predetermined parameters 
* and adds it to the original amount
**/
const FEE_MODE = window.paytheory.SURCHARGE

// create a place to store the SDK details
let myPayTheory

(async() => {
    /**
    * initialize the SDK (can also be called as a promise)
    *
    * if providing tags but no styles, provide an empty object
    * as a placeholder
    **/

    myPayTheory = await window.paytheory.create(
        API_KEY,
        STYLES,
        TAGS,
        FEE_MODE)

    // mount the hosted fields into the container
    myPayTheory.mount()

    // handle callbacks
    myPayTheory.readyObserver(ready => {
        /**
        * ready is a boolean indicator
        * fires when SDK is loaded and ready
        * this is where you would associate any listeners
        * to trigger initTransaction
        * or optionally confirmation
        **/
    })

    // only needed when REQUIRE_CONFIRMATION is true
    myPayTheory.tokenizeObserver(tokenized => {
        /**
        * results of the payment card or ACH tokenization
        * fires once when tokenization is completed
        * this is a good place to enable confirmation
        **/
    })

    // only needed when REQUIRE_CONFIRMATION is true
    myPayTheory.captureObserver(transactionResult => {
        /**
        * results of the transaction with confirmation
        * fires once when capture is completed
        **/
    })

    // only needed when REQUIRE_CONFIRMATION is false
    myPayTheory.transactedObserver(transactionResult => {
        /**
        * results of the transaction without confirmation
        * fires once when transaction is completed
        **/
    })

    myPayTheory.validObserver(valid => {
        /**
        * valid is a boolean indicator
        * fires every time the valid state of the hosted field changes
        * when valid is true is a good time to enable initTransaction
        **/
    })

    myPayTheory.errorObserver(error => {
        /**
        * error is false or a message
        * fires every time the error state/message changes
        **/
    })

    myPayTheory.cashObserver(cashResult => {
        /**
        * results of the cash barcode generation
        * fires once barcode is generated following initTransaction
        **/
    })

})()

```

## Initiate the transaction

When ready submit the transaction using the saved card, ACH, or cash details:

```javascript

// optionally provide details about the buyer
const SHIPPING_DETAILS = {
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

// optional parameter to require confimation step for Card or ACH
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
    myPayTheory.initTransaction(
      AMOUNT,
      SHIPPING_DETAILS,
      REQUIRE_CONFIRMATION // defaults to false
    )
}

/**
 * optional
 * use the tokenObserver to handle confirmation step
 **/
myPayTheory.tokenizeObserver((card) => {
    const confirmation =  `Are you sure you want to make a payment on ${card.brand} card beginning with ${card.first_six}`
    if (confirm(confirmation)) {
      myPayTheory.confirm();
    } else {
      myPayTheory.cancel();
    }
});


/**
 * use the ready observer from above to apply listeners
 * provide your own component IDs
 **/
myPayTheory.readyObserver(ready => {
    ...
    document
        .getComponentById("initiate-payment-button-id")
        .addEventListener("click", clickListener)
    ...
})

```

Once the transaction has ended in either success or failure the buyer should be
directed to a results page.

## Tokenization response

When the confirm option of initTransaction is set to true, the payment card or ACH token details are returned in tokenizeObserver

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

## Cash response

While generating the Barcode it will use the geoloaction to return a map url for the users specific location. 
If this is the first time it has been requested the user will have the opportunity to accept or decline the request.  

Upon completion of generating the cash barcode you will have these details returned:

```json
{	
    "BarcodeUid":"XXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX@partner",
    "Merchant":"XXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXX",
    "barcode":"12345678901234567890",
    "barcodeFee":"2.0",
    "barcodeUrl":"https://partner.env.ptbar.codes/XXXXXX",
    "mapUrl":"https://pay.vanilladirect.com/pages/locations",
}
```

It is recommended at a minimum to provide both the Barcode URL and Map URL as external links to the payee.  
They can also be embedded in an iFrame on the page or shared in some other method.

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

    <!-- for lab -->
    <script src="https://test.sdk.paytheorystudy.com"></script>

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
