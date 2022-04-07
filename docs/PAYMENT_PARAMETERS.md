# Payment Parameters

Payment Parameters can be used to set parameters for a specific payment.

These profiles are able to be set in the Partner Portal.

![Payment Parameters List](https://books-ui-assets.s3.amazonaws.com/payment-parameters-list.png)

They can be used to make a sure a specific payment meets certain requirements before it is processed.

![Payment Parameters List](https://books-ui-assets.s3.amazonaws.com/payment-parameters-details.png)

Upon initialization of a transaction it will use these payment parameters to create a payment intent. The payment intent will immediately be charged in the case of a card or ACH payment. In the case of a cash payment the barcode will represent the payment intent, and it will not be charged until the barcode is redeemed at a participating retailer.

## Payment Parameters Properties

These are the properties you will be able to configure for a set of payment parameters.

**Payment Parameters Name**: The name of the payment parameters.
* Alphanumeric characters and dashes only.
* Must be unique for these parameters.

**Days Until Expiry**: Days until the payment intent expires and is no longer valid.

**Payment Activation Date**: Date that a payment using these parameters will begin being valid.

**Payment Expiration Date**: Date that a payment using these parameters will stop being valid.

**Minimum Amount Limit**: Amount the payment must be greater than to be a valid payment.
* This will default to $1 if left blank.

**Maximum Amount Limit**: Amount the payment must be less than to be a valid payment.
* This will default to $5000 if left blank.

**Enabled**: Payments using these parameters will only be valid if the parameters are enabled.
* This allows you to disable a group of payment intents by disabling a set of payment parameters.

## Card, ACH and Cash details

### Card and ACH Payments

* Payment Parameters will be checked at the time of the transaction. If the payment parameters are invalid it will fail and return an error message.

* Payment Parameters will be most beneficial in ensuring that a transaction falls within a certain date and price range for Card and ACH payments.
### Cash Payments

* Payment Parameters will be checked both at the time of barcode creation and at the time of the transaction.

* Payment Parameters will be most beneficial in ensuring that a transaction falls within a certain date and price range just like Card and ACH payments. 

* They will also be beneficial in disabling barcodes that a merchant no longer wants to collect on.

## Example Use Case

### Expiring Payment

Payments received after a certain date need to be invalid and not be charged.
* Stale links should not be able to process ACH or Card payments or create Cash barcodes.
* Previously generated barcodes should not be able to be used to make payments at retailers.

Create a new set of parameters and set these attributes:

**Payment Parameters Name**: pay-before-end-of-year

**Payment Expiration Date**: 12/31/2022

The minimum amount limit will be set to the $1 and the maximum amount limit will be set to $5000 which is our standard default.
