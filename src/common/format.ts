import * as data from './data';
import { ElementTypes, MERCHANT_FEE, SERVICE_FEE } from './data';
import { handleError } from './message';
import {
  BillingInfo,
  CashBarcodeObject,
  CashBarcodeResponse,
  CheckoutDetails,
  ConfirmationResponse,
  ErrorResponse,
  FailedTransactionResponse,
  HealthExpenseType,
  Level3DataSummary,
  PayorInfo,
  PaymentMethod,
  ResponseMessageTypes,
  SuccessfulTransactionResponse,
  TokenizedPaymentMethodObject,
  TokenizedPaymentMethodResponse,
  Transaction,
  TransactProps,
} from './pay_theory_types';

// Message Types that would come back from the iframe for async messages
export const CONFIRMATION_STEP = 'pt-static:confirm';
export const CASH_BARCODE_STEP = 'pt-static:cash-complete';
export const COMPLETE_STEP = 'pt-static:complete';
export const ERROR_STEP = 'pt-static:error';
export const FIELDS_READY_STEP = 'pt-static:fields-ready';

export interface PayTheoryDataObject {
  account_code: string | number;
  billing_info?: BillingInfo;
  fee?: number;
  healthExpenseType?: HealthExpenseType;
  invoice_id?: string;
  level3DataSummary?: Level3DataSummary;
  oneTimeUseToken?: boolean;
  payor_id?: string;
  payment_parameters: string;
  receipt_description?: string;
  recurring_id?: string;
  reference: string | number;
  send_receipt?: boolean;
  timezone?: string;
  expanded_response?: boolean;
}

export interface ModifiedTransactProps extends TransactProps {
  customerInfo?: PayorInfo;
  payTheoryData: PayTheoryDataObject;
  shippingDetails?: PayorInfo;
}

export interface ModifiedCheckoutDetails extends CheckoutDetails {
  payTheoryData: PayTheoryDataObject;
  payorInfo: undefined;
}

export const parseInputParams = (
  inputParams: TransactProps | CheckoutDetails,
): ModifiedTransactProps | ModifiedCheckoutDetails => {
  const { payorId, invoiceId, recurringId, metadata = {} } = inputParams;
  const inputCopy = JSON.parse(JSON.stringify(inputParams)) as ModifiedTransactProps;
  inputCopy.payTheoryData = {
    account_code: inputParams.accountCode ?? (metadata['pay-theory-account-code'] as string),
    billing_info: (inputParams as TransactProps).billingInfo,
    fee: (inputParams as TransactProps).fee,
    healthExpenseType: inputCopy.healthExpenseType,
    invoice_id: invoiceId,
    level3DataSummary: inputCopy.level3DataSummary,
    oneTimeUseToken: inputCopy.oneTimeUseToken ?? false,
    payment_parameters:
      inputParams.paymentParameters ?? (metadata['payment-parameters-name'] as string),
    payor_id: payorId,
    receipt_description:
      (inputParams as TransactProps).receiptDescription ??
      (metadata['pay-theory-receipt-description'] as string),
    recurring_id: recurringId,
    reference:
      (inputParams as TransactProps).reference ?? (metadata['pay-theory-reference'] as string),
    send_receipt: (inputParams as TransactProps).sendReceipt ?? !!metadata['pay-theory-receipt'],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    expanded_response: (inputParams as TransactProps).expandedResponse,
  };
  inputCopy.metadata = metadata;
  return inputCopy;
};

export interface FieldsReadyMessage {
  type: typeof FIELDS_READY_STEP;
}

export interface ErrorMessage {
  type: typeof ERROR_STEP;
  error: string;
  element: ElementTypes;
}

export interface ConfirmationMessage {
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
}

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

export interface SuccessfulTransactionMessage {
  type: typeof COMPLETE_STEP;
  paymentType: 'transfer';
  expandedResponse: false;
  body: {
    receipt_number: string;
    last_four: string;
    brand: string;
    created_at: string;
    amount: number;
    service_fee: number;
    state: 'PENDING' | 'SUCCESS';
    metadata: Record<string | number, string | number | boolean>;
    payor_id: string;
    payment_method_id: string;
  };
}

export interface SuccessfulTransactionMessageExpanded {
  type: typeof COMPLETE_STEP;
  paymentType: 'transfer';
  expandedResponse: true;
  body: Transaction;
}

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

export interface FailedTransactionMessage {
  type: typeof COMPLETE_STEP;
  paymentType: 'transfer';
  expandedResponse: false;
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
}

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

export const parseExpandedTransactionMessage = (
  message: SuccessfulTransactionMessageExpanded,
): SuccessfulTransactionResponse | FailedTransactionResponse => {
  if (message.body.status === 'FAILED') {
    return {
      type: ResponseMessageTypes.FAILED,
      body: message.body,
    };
  } else {
    return {
      type: ResponseMessageTypes.SUCCESS,
      body: message.body,
    };
  }
};

export interface CashBarcodeMessage {
  type: typeof CASH_BARCODE_STEP;
  body: CashBarcodeObject;
}

export interface TokenizedPaymentMethodMessage {
  type: typeof COMPLETE_STEP;
  paymentType: 'tokenize';
  expandedResponse: false;
  body: TokenizedPaymentMethodObject;
}

export interface TokenizedPaymentMethodMessageExpanded {
  type: typeof COMPLETE_STEP;
  paymentType: 'tokenize';
  expandedResponse: true;
  body: PaymentMethod;
}

export const parseResponse = (
  message:
    | ConfirmationMessage
    | SuccessfulTransactionMessage
    | SuccessfulTransactionMessageExpanded
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
        if (message.expandedResponse === true) {
          return parseExpandedTransactionMessage(message as SuccessfulTransactionMessageExpanded);
        }
        if (message.body.state === 'FAILURE') {
          return parseFailedTransactionMessage(message as FailedTransactionMessage);
        }
        return parseSuccessfulTransactionMessage(message as SuccessfulTransactionMessage);
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
  new Promise(resolve => {
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

      const error = () => {
        resolve(response);
      };

      navigator.geolocation.getCurrentPosition(success, error, options);
    }
  });
