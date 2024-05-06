import * as data from './data';
import { ElementTypes, MERCHANT_FEE, SERVICE_FEE } from './data';
import {
  BillingInfo,
  CashBarcodeObject,
  CashBarcodeResponse,
  CheckoutDetails,
  ConfirmationResponse,
  ErrorResponse,
  FailedTransactionResponse,
  PayorInfo,
  ResponseMessageTypes,
  SuccessfulTransactionResponse,
  TokenizedPaymentMethodObject,
  TokenizedPaymentMethodResponse,
  TransactProps,
  HealthExpenseType,
  Level3DataSummary,
} from './pay_theory_types';
import { handleError } from './message';

// Message Types that would come back from the iframe for async messages
export const CONFIRMATION_STEP = 'pt-static:confirm';
export const CASH_BARCODE_STEP = 'pt-static:cash-complete';
export const COMPLETE_STEP = 'pt-static:complete';
export const ERROR_STEP = 'pt-static:error';
export const FIELDS_READY_STEP = 'pt-static:fields-ready';

export type PayTheoryDataObject = {
  account_code: string | number;
  reference: string | number;
  payment_parameters: string;
  payor_id?: string;
  send_receipt?: boolean;
  receipt_description?: string;
  invoice_id?: string;
  recurring_id?: string;
  timezone?: string;
  fee?: number;
  billing_info?: BillingInfo;
  healthExpenseType?: HealthExpenseType;
  level3DataSummary?: Level3DataSummary;
};

export interface ModifiedTransactProps extends TransactProps {
  payTheoryData: PayTheoryDataObject;
  customerInfo?: PayorInfo;
  shippingDetails?: PayorInfo;
}

export interface ModifiedCheckoutDetails extends CheckoutDetails {
  payTheoryData: PayTheoryDataObject;
  payorInfo: undefined;
}

export const parseInputParams = (
  inputParams: TransactProps | CheckoutDetails,
): ModifiedTransactProps | ModifiedCheckoutDetails => {
  //@ts-ignore this will just set billingInfo and fee to undefined if they don't exist
  const { payorId, invoiceId, recurringId, fee, metadata = {}, billingInfo } = inputParams;
  const inputCopy = JSON.parse(JSON.stringify(inputParams)) as ModifiedTransactProps;
  inputCopy.payTheoryData = {
    account_code: inputParams.accountCode || (metadata['pay-theory-account-code'] as string),
    billing_info: billingInfo,
    fee: fee,
    invoice_id: invoiceId,
    payment_parameters:
      inputParams.paymentParameters || (metadata['payment-parameters-name'] as string),
    payor_id: payorId,
    receipt_description:
      // @ts-ignore this will just set receipt description to undefined if it doesn't exist
      inputParams.receiptDescription || (metadata['pay-theory-receipt-description'] as string),
    recurring_id: recurringId, //@ts-ignore this will just set reference to undefined if it doesn't exist
    reference: inputParams.reference || (metadata['pay-theory-reference'] as string), //@ts-ignore  this will just set send receipt to undefined if it doesn't exist
    send_receipt: inputParams.sendReceipt || (metadata['pay-theory-receipt'] as boolean),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    healthExpenseType: inputCopy.healthExpenseType,
    level3DataSummary: inputCopy.level3DataSummary,
  };
  inputCopy.metadata = metadata;
  return inputCopy;
};

export type FieldsReadyMessage = {
  type: typeof FIELDS_READY_STEP;
};

export type ErrorMessage = {
  type: typeof ERROR_STEP;
  error: string;
  element: ElementTypes;
};

export type ConfirmationMessage = {
  type: typeof CONFIRMATION_STEP;
  body: {
    fee_mode: typeof MERCHANT_FEE | typeof SERVICE_FEE;
    first_six: string;
    last_four: string;
    brand: string;
    idempotency: string;
    amount: number;
    fee: number;
  };
};

export const parseConfirmationMessage = (message: ConfirmationMessage): ConfirmationResponse => {
  const fee = message.body.fee_mode === data.SERVICE_FEE ? message.body.fee : 0;
  return {
    type: ResponseMessageTypes.CONFIRMATION,
    body: {
      first_six: message.body.first_six,
      last_four: message.body.last_four,
      brand: message.body.brand,
      receipt_number: message.body.idempotency,
      amount: message.body.amount,
      service_fee: fee,
    },
  };
};

export type SuccessfulTransactionMessage = {
  type: typeof COMPLETE_STEP;
  paymentType: 'transfer';
  body: {
    receipt_number: string;
    last_four: string;
    brand: string;
    created_at: string;
    amount: number;
    service_fee: number;
    state: 'PENDING' | 'SUCCESS';
    metadata: { [keys: string | number]: string | number | boolean };
    payor_id: string;
    payment_method_id: string;
  };
};

export const parseSuccessfulTransactionMessage = (
  message: SuccessfulTransactionMessage,
): SuccessfulTransactionResponse => {
  return {
    type: ResponseMessageTypes.SUCCESS,
    body: {
      receipt_number: message.body.receipt_number,
      last_four: message.body.last_four,
      brand: message.body.brand,
      created_at: message.body.created_at,
      amount: message.body.amount,
      service_fee: message.body.service_fee,
      state: message.body.state,
      // Keeping tags in the response for backwards compatibility
      tags: message.body.metadata,
      metadata: message.body.metadata,
      payor_id: message.body.payor_id,
      payment_method_id: message.body.payment_method_id,
    },
  };
};

export type FailedTransactionMessage = {
  type: typeof COMPLETE_STEP;
  paymentType: 'transfer';
  body: {
    receipt_number: string;
    last_four: string;
    brand: string;
    state: 'FAILURE';
    type: string;
    payor_id: string;
    status: {
      result: 'FAILED';
      reason: {
        error_code: string;
        error_text: string;
      };
    };
  };
};

export const parseFailedTransactionMessage = (
  message: FailedTransactionMessage,
): FailedTransactionResponse => {
  return {
    type: ResponseMessageTypes.FAILED,
    body: {
      receipt_number: message.body.receipt_number,
      last_four: message.body.last_four,
      brand: message.body.brand,
      state: message.body.state,
      type: message.body.type,
      payor_id: message.body.payor_id,
      reason: {
        failure_code: message.body.status.reason.error_code,
        failure_text: message.body.status.reason.error_text,
      },
    },
  };
};

export type CashBarcodeMessage = {
  type: typeof CASH_BARCODE_STEP;
  body: CashBarcodeObject;
};

export type TokenizedPaymentMethodMessage = {
  type: typeof COMPLETE_STEP;
  paymentType: 'tokenize';
  body: TokenizedPaymentMethodObject;
};

export const parseResponse = (
  message:
    | ConfirmationMessage
    | SuccessfulTransactionMessage
    | FailedTransactionMessage
    | CashBarcodeMessage
    | TokenizedPaymentMethodMessage
    | ErrorMessage,
):
  | ConfirmationResponse
  | SuccessfulTransactionResponse
  | FailedTransactionResponse
  | CashBarcodeResponse
  | TokenizedPaymentMethodResponse
  | ErrorResponse => {
  switch (message.type) {
    case CONFIRMATION_STEP:
      return parseConfirmationMessage(message);
    case COMPLETE_STEP:
      if (message.paymentType === 'tokenize') {
        return {
          type: ResponseMessageTypes.TOKENIZED,
          body: message.body,
        };
      } else {
        if (message.body.state === 'FAILURE') {
          return parseFailedTransactionMessage(message as FailedTransactionMessage);
        } else {
          return parseSuccessfulTransactionMessage(message as SuccessfulTransactionMessage);
        }
      }
    case CASH_BARCODE_STEP:
      return {
        type: ResponseMessageTypes.CASH,
        body: message.body,
      };
    case ERROR_STEP:
      return handleError(message.error);
    default:
      return message;
  }
};

export const localizeCashBarcodeUrl = (
  response: CashBarcodeResponse,
): Promise<CashBarcodeResponse> =>
  new Promise((resolve, _) => {
    {
      const options = {
        timeout: 5000,
        maximumAge: 0,
      };

      const success: PositionCallback = pos => {
        const crd = pos.coords;
        response.body.mapUrl = `https://map.payithere.com/biller/4b8033458847fec15b9c840c5b574584/?lat=${crd.latitude}&lng=${crd.longitude}`;
        resolve(response);
      };

      function error() {
        resolve(response);
      }

      navigator.geolocation.getCurrentPosition(success, error, options);
    }
  });
