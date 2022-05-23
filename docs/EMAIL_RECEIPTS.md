# Email Receipts

Email receipts are available to be sent at the time of a payment and refund.

## Payment Receipt

There are two requirements for sending an email receipt with a payment.

* Pass an `email` into the customer info.
* Pass `pay-theory-receipt` into the transaction metadata.

You can optionally include a receipt description. 
* Pass `pay-theory-receipt-description` into the transaction metadata. Defaults to "Payment from {Merchant Name}".

```javascript
const AMOUNT = 1000

// email is required for a receipt to send
const CUSTOMER_INFO = {
    "first_name": "Some",
    "last_name": "Body",
    "email": "somebody@paytheory.com"
}

// pass in pay-theory-receipt and set it to true for a transaction receipt to send
const TRANSACTION_METADATA = {
    "pay-theory-receipt": true,
    "pay-theory-receipt-description": "School Technology Fees"
};

myPayTheory.transact({
  amount: AMOUNT,
  customerInfo: CUSTOMER_INFO,
  metadata: TRANSACTION_METADATA
})
```

As long as those are both included when calling the transact function it will send am email receipt.

## Refund Receipts

For sending an email with a refund you will be prompted to enter an email in the portal at the time of the refund.

![Refund Receipt Email](https://books-ui-assets.s3.amazonaws.com/refund-receipt.png)

If you select `NO` it will process the refund with no receipt.

If you include an email and select `SEND` it will send a receipt to the email address.
