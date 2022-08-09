# Email Receipts

Email receipts are available to be sent at the time of a payment and refund.

## Payment Receipt

There are two requirements for sending an email receipt with a payment.

* Pass an `email` into the payor info or a `payorId` with an email tied to it.
* Pass `sendReceipt` into the transact arguments.

You can optionally include a receipt description. 
* Pass `receiptDescription` into the transactArguments. Defaults to "Payment from {Merchant Name}".

```javascript
const AMOUNT = 1000

// email is required for a receipt to send
const PAYOR_INFO = {
    "first_name": "Some",
    "last_name": "Body",
    "email": "somebody@paytheory.com"
}


myPayTheory.transact({
    amount: AMOUNT,
    payorInfo: PAYOR_INFO,
    sendReceipt: true, 
    receiptDescription: "School Technology Fees"
})
```

As long as `email` and `sendReceipt` are included when calling the transact function it will send an email receipt.

## Refund Receipts

For sending an email with a refund you will be prompted to enter an email in the portal at the time of the refund.

The prompt will auto-populate the email from the customer info. It can be changed before sending the receipt.

![Refund Receipt Email](https://books-ui-assets.s3.amazonaws.com/refund-receipt.png)

If you select `NO` it will process the refund with no receipt.

If you include an email and select `SEND` it will send a receipt to the email address.
