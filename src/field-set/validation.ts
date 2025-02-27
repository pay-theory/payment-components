/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import common from '../common';
import { handleTypedError } from '../common/message';
import PayTheoryHostedField from '../components/pay-theory-hosted-field';
import {
  BillingInfo,
  ErrorResponse,
  ErrorType,
  HealthExpenseType,
  Level3DataSummary,
  PayorInfo,
  TaxIndicatorType,
} from '../common/pay_theory_types';
import {
  ModifiedCheckoutDetails,
  ModifiedTransactProps,
  PayTheoryDataObject,
} from '../common/format';
import { ElementTypes } from '../common/data';

const findField =
  (type: ElementTypes) =>
  (element: PayTheoryHostedField | false, currentElement: PayTheoryHostedField) => {
    return element ? element : currentElement.field === type ? currentElement : false;
  };

const findCVV = findField('card-cvv');
const findExp = findField('card-exp');
const findAccountNumber = findField('account-number');
const findBankCode = findField('routing-number');
const findAccountType = findField('account-type');
const findAccountName = findField('account-name');
const findInstitutionNumber = findField('institution-number');
const findTransitNumber = findField('transit-number');

// partner mode is used to indicate migration builds
const checkApiKey = (key: unknown) => {
  if (!validate<string>(key, 'string')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'API Key is required and must be a string');
  }
  const keyParts = key.split('-');
  const environment = keyParts[0];
  let stage = keyParts[1];
  if (['new', 'old'].includes(stage)) {
    stage = keyParts[2];
  }

  if (environment !== common.PARTNER || stage !== common.STAGE) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      'Valid API Key not found. Please provide a valid API Key',
    );
  }
};

const validate = <T>(value: unknown, type: string): value is T => {
  return typeof value === type && Boolean(value);
};

const checkFeeMode = (mode: unknown): ErrorResponse | null => {
  if (
    !validate<string>(mode, 'string') ||
    ![common.MERCHANT_FEE, common.SERVICE_FEE].includes(mode)
  ) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      `Fee Mode should be either 'merchant_fee' or 'service_fee' which are also available as constants at window.paytheory.MERCHANT_FEE and window.paytheory.SERVICE_FEE`,
    );
  }
  return null;
};

const checkMetadata = (metadata: unknown): ErrorResponse | null => {
  if (!validate(metadata, 'object')) {
    // throw Error(`Metadata should be a JSON Object`);
    return handleTypedError(ErrorType.INVALID_PARAM, `Metadata should be a JSON Object.`);
  }
  return null;
};

const checkStyles = (styles: unknown): ErrorResponse | null => {
  if (!validate(styles, 'object')) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      `Styles should be a JSON Object.
      An example of the object is at https://docs.paytheory.com/docs/sdk/javascript/hosted_fields#styles-object`,
    );
  }
  return null;
};

const checkAmount = (amount: unknown): ErrorResponse | null => {
  const error = isValidAmount(amount);
  if (error) return handleTypedError(ErrorType.INVALID_PARAM, error.error);
  return null;
};

const supportedCountries = ['USA', 'CAN'];

const checkCountry = (country: unknown): ErrorResponse | null => {
  if (!validate<string>(country, 'string')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'Country is required and must be a string');
  }
  if (!supportedCountries.includes(country)) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      `You must pass in a supported country. Contact Pay Theory for more information.`,
    );
  }
  return null;
};

const checkInitialParams = (
  key: unknown,
  mode: unknown,
  metadata: unknown,
  styles: unknown,
  amount: unknown,
  country: unknown,
): ErrorResponse | null => {
  let result = checkApiKey(key);
  if (result) return result;
  if (mode) result = checkFeeMode(mode);
  if (result) return result;
  result = checkMetadata(metadata);
  if (result) return result;
  result = checkStyles(styles);
  if (result) return result;
  if (amount !== undefined) result = checkAmount(amount);
  if (result) return result;
  result = checkCountry(country);
  if (result) return result;
  return null;
};

// Checks the dom for elements and returns errors if there are missing elements or conflicting elements
const findCardNumberError = (processedElements: PayTheoryHostedField[]): false | string => {
  if (processedElements.reduce(findExp, false) === false) {
    return 'missing credit card expiration field required for payments';
  }

  if (processedElements.reduce(findCVV, false) === false) {
    return 'missing CVV field required for payments';
  }

  if (document.getElementById(`pay-theory-credit-card`)) {
    return 'credit card element is not allowed when using credit card number';
  }
  return false;
};

const findCombinedCardError = (processedElements: PayTheoryHostedField[]) => {
  if (processedElements.reduce(findExp, false)) {
    return 'expiration is not allowed when using combined credit card';
  }

  if (processedElements.reduce(findCVV, false)) {
    return 'CVV is not allowed when using combined credit card';
  }

  if (document.getElementById(`pay-theory-credit-card-number`)) {
    return 'credit card number is not allowed when using combined credit card';
  }
  return false;
};

const achCheck = [
  {
    check: findAccountName,
    error: 'missing ACH account name field required for payments',
  },
  {
    check: findAccountNumber,
    error: 'missing ACH account number field required for payments',
  },
  {
    check: findAccountType,
    error: 'missing ACH account type field required for payments',
  },
  {
    check: findBankCode,
    error: 'missing ACH routing number field required for payments',
  },
];

const eftCheck = [
  {
    check: findAccountName,
    error: 'missing EFT account name field required for payments',
  },
  {
    check: findAccountNumber,
    error: 'missing EFT account number field required for payments',
  },
  {
    check: findAccountType,
    error: 'missing EFT account type field required for payments',
  },
  {
    check: findInstitutionNumber,
    error: 'missing EFT institution number field required for payments',
  },
  {
    check: findTransitNumber,
    error: 'missing EFT transit number field required for payments',
  },
];

const findAchError = (processedElements: PayTheoryHostedField[]): string | false => {
  if (processedElements.length === 0) {
    return false;
  }

  achCheck.forEach(obj => {
    if (processedElements.reduce(obj.check, false) === false) {
      return obj.error;
    }
  });

  return false;
};

const findEftError = (processedElements: PayTheoryHostedField[]): string | false => {
  if (processedElements.length === 0) {
    return false;
  }

  eftCheck.forEach(obj => {
    if (processedElements.reduce(obj.check, false) === false) {
      return obj.error;
    }
  });

  return false;
};

const findCardError = (
  processedElements: PayTheoryHostedField[],
  transacting: PayTheoryHostedField[],
) => {
  let error: false | string = false;
  if (processedElements.length === 0) {
    return error;
  }

  if (transacting.length === 0) {
    error = 'missing credit card entry field required for payments';
  } else if (transacting[0].id === 'pay-theory-credit-card-number-tag-frame') {
    error = findCardNumberError(processedElements);
  } else {
    error = findCombinedCardError(processedElements);
  }
  return error;
};

const findCashError = (processedElements: PayTheoryHostedField[]): string | false => {
  let error: string | false = false;
  if (processedElements.length === 0) {
    return error;
  }

  if (processedElements.reduce(findField('cash-name'), false) === false) {
    error = 'missing Cash name field required for payments';
  }

  if (processedElements.reduce(findField('cash-contact'), false) === false) {
    error = 'missing Cash Contact info field required for payments';
  }

  return error;
};

const validateEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const validatePhone = (phone: string) => {
  // strip out all non-numeric characters
  const stripped = phone.replace(/\D/g, '');
  // check if the number is between 5 and 15 digits
  return stripped.length >= 5 && stripped.length <= 15;
};

interface payorInfo {
  same_as_billing?: boolean;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  personal_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
}

const isValidPayorInfo = (payorInfo: payorInfo): ErrorResponse | null => {
  if (!validate(payorInfo, 'object')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'payor_info is not an object');
  }
  if (payorInfo.same_as_billing === true) {
    const allowedKeys = ['same_as_billing', 'email', 'phone'];
    const keys = Object.keys(payorInfo);
    for (const key of keys) {
      if (!allowedKeys.includes(key)) {
        return handleTypedError(
          ErrorType.INVALID_PARAM,
          `if payor_info is same_as_billing, only the following keys are allowed: ${allowedKeys.join(', ')}`,
        );
      }
    }
  }
  if (payorInfo.email) {
    if (!validate(payorInfo.email, 'string')) {
      return handleTypedError(ErrorType.INVALID_PARAM, 'payor_info.email is not a string');
    }
    if (!validateEmail(payorInfo.email)) {
      return handleTypedError(ErrorType.INVALID_PARAM, 'payor_info.email is not a valid email');
    }
  }
  if (payorInfo.phone) {
    if (!validate(payorInfo.phone, 'string')) {
      return handleTypedError(ErrorType.INVALID_PARAM, 'payor_info.phone is not a string');
    }
    if (!validatePhone(payorInfo.phone)) {
      return handleTypedError(
        ErrorType.INVALID_PARAM,
        'payor_info.phone is not a valid phone number',
      );
    }
  }
  return null;
};

const nullifyEmptyStrings = (params: object) => {
  const newParams = structuredClone(params);
  Object.keys(newParams).forEach(key => {
    const value = newParams[key as keyof typeof newParams] as unknown;
    if (value === '') {
      // @ts-expect-error - key is a string and can be used to access the object
      newParams[key as keyof typeof newParams] = null;
    } else if (value instanceof Object) {
      nullifyEmptyStrings(value);
    }
  });
  return newParams;
};

const formatPayorObject = (payorInfo: PayorInfo): PayorInfo => {
  // Make a deep copy of the payorInfo object
  let payorCopy = structuredClone(payorInfo);
  // Nullify unknown empty strings
  payorCopy = nullifyEmptyStrings(payorCopy);
  // Strip out unknown non-numeric characters from the phone number
  if (payorCopy.phone) {
    payorCopy.phone = payorCopy.phone.replace(/\D/g, '');
  }
  return payorCopy;
};

const isvalidTransactParams = (
  amount: unknown,
  payorInfo: unknown,
  metadata: unknown,
): ErrorResponse | null => {
  //Make sure that we have the base required settings
  if (
    !validate<number>(amount, 'number') ||
    !validate<object>(metadata, 'object') ||
    !validate<object>(payorInfo, 'object')
  ) {
    const missing = `${!validate(amount, 'number') ? 'amount ' : ''}${!validate(metadata, 'object') ? 'metadata ' : ''}${!validate(payorInfo, 'object') ? 'payorInfo ' : ''}`;
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      'Some required fields are missing or invalid: ' + missing,
    );
  }
  if (amount <= 0) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'amount must be a positive integer');
  }
  return null;
};

const isValidTokenizeParams = (payorInfo: unknown, metadata: unknown): ErrorResponse | null => {
  //Make sure that we have the base required settings
  if (!validate(metadata, 'object') || !validate(payorInfo, 'object')) {
    const missing = `${!validate(metadata, 'object') ? 'metadata ' : ''}${!validate(payorInfo, 'object') ? 'payorInfo ' : ''}`;
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      'Some required fields are missing or invalid: ' + missing,
    );
  }
  return null;
};

const isValidAmount = (amount: unknown): ErrorResponse | null => {
  if (!validate<number>(amount, 'number')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'amount must be a positive integer');
  }
  if (amount % 1 !== 0) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'amount cannot have a decimal');
  }
  return null;
};

// const isValidDeviceId = (deviceId: unknown): ErrorResponse | null => {
//   if (!validate(deviceId, 'string')) {
//     return handleTypedError(ErrorType.INVALID_PARAM, 'deviceId is required and must be a string');
//   }
//   return null;
// };

const isValidPayorDetails = (payorInfo: unknown, payorId: unknown): ErrorResponse | null => {
  const keys = Object.keys(payorInfo);
  // Verify both id and info aren't passed in
  if (payorId && keys.length > 0) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      'Unable to process when both payorId and payorInfo are provided',
    );
  } else if (payorId && !validate(payorId, 'string')) {
    // Verify payorId is a string if present
    return handleTypedError(ErrorType.INVALID_PARAM, 'payorId must be a string');
  }
  return null;
};

const isValidInvoiceAndRecurringId = (payTheoryInfo: PayTheoryDataObject): ErrorResponse | null => {
  const { invoice_id, recurring_id } = payTheoryInfo;
  if (invoice_id && !validate(invoice_id, 'string')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'invoiceId must be a string');
  }
  if (recurring_id && !validate(recurring_id, 'string')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'recurringId must be a string');
  }
  if (invoice_id && recurring_id) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      'invoiceId and recurringId cannot both be present',
    );
  }
  return null;
};

const isValidFeeMode = (feeMode: string): ErrorResponse | null => {
  if (![common.MERCHANT_FEE, common.SERVICE_FEE].includes(feeMode)) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      'feeMode must be either MERCHANT_FEE or SERVICE_FEE',
    );
  }
  return null;
};

const isValidFeeAmount = (fee: unknown): ErrorResponse | null => {
    if (Number(fee) >= 0) {
        return null;
    }
    return handleTypedError(ErrorType.INVALID_PARAM, 'fee must be a positive integer');
};

const isValidBillingInfo = (billingInfo: unknown): ErrorResponse | null => {
  if (billingInfo) {
    if (!validate<BillingInfo>(billingInfo, 'object')) {
      return handleTypedError(ErrorType.INVALID_PARAM, 'billingInfo must be an object');
    }
    if (billingInfo.address && !validate(billingInfo.address, 'object')) {
      return handleTypedError(ErrorType.INVALID_PARAM, 'billingInfo.address must be an object');
    }
    if (billingInfo.address && !validate(billingInfo.address.postal_code, 'string')) {
      return handleTypedError(
        ErrorType.INVALID_PARAM,
        'billingInfo.address.postal_code is required when passing in billingInfo',
      );
    }
  }
  return null;
};

const isValidL3DataSummary = (l3DataSummary: unknown): ErrorResponse | null => {
  // If null or undefined then return null
  if (l3DataSummary === null || l3DataSummary === undefined) return null;

  if (!validate<Level3DataSummary>(l3DataSummary, 'object')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'l3DataSummary must be an object');
  }

  if (l3DataSummary.tax_amt && !validate(l3DataSummary.tax_amt, 'number')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'l3DataSummary.tax_amt must be a number');
  }
  if (l3DataSummary.frght_amt && !validate(l3DataSummary.frght_amt, 'number')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'l3DataSummary.freight_amt must be a number');
  }
  if (l3DataSummary.duty_amt && !validate(l3DataSummary.duty_amt, 'number')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'l3DataSummary.duty_amt must be a number');
  }
  if (l3DataSummary.discnt_amt && !validate(l3DataSummary.discnt_amt, 'number')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'l3DataSummary.discount_amt must be a number');
  }
  if (l3DataSummary.purch_idfr && !validate(l3DataSummary.purch_idfr, 'string')) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      'l3DataSummary.ship_from_zip must be a string',
    );
  }
  if (l3DataSummary.order_num && !validate(l3DataSummary.order_num, 'string')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'l3DataSummary.order_num must be a string');
  }
  if (l3DataSummary.dest_postal_code && !validate(l3DataSummary.dest_postal_code, 'string')) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      'l3DataSummary.dest_postal_code must be a string',
    );
  }
  if (l3DataSummary.prod_desc) {
    if (!validate(l3DataSummary.prod_desc, 'object')) {
      return handleTypedError(ErrorType.INVALID_PARAM, 'l3DataSummary.prod_desc must be an array');
    }
    for (const value of l3DataSummary.prod_desc) {
      if (!validate(value, 'string')) {
        return handleTypedError(
          ErrorType.INVALID_PARAM,
          'l3DataSummary.prod_desc must be an array of strings',
        );
      }
    }
  }
  if (l3DataSummary.tax_ind) {
    if (!validate(l3DataSummary.tax_ind, 'string')) {
      return handleTypedError(ErrorType.INVALID_PARAM, 'l3DataSummary.tax_ind must be a string');
    }
    if (!Object.values(TaxIndicatorType).includes(l3DataSummary.tax_ind)) {
      return handleTypedError(
        ErrorType.INVALID_PARAM,
        'l3DataSummary.tax_ind must be one of the following: ' +
          Object.values(TaxIndicatorType).join(', '),
      );
    }
  }

  return null;
};

const isValidHealthExpenseType = (healthExpenseType: unknown): ErrorResponse | null => {
  if (healthExpenseType === null || healthExpenseType === undefined) return null;
  if (!validate<string>(healthExpenseType, 'string')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'healthExpenseType must be a string');
  } //@ts-expect-error - healthExpenseType is a string and want to compare to all values of the enum which are also strings
  if (!Object.values(HealthExpenseType).includes(healthExpenseType)) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      'healthExpenseType must be one of the following: ' +
        Object.values(HealthExpenseType).join(', '),
    );
  }
  return null;
};

const validateHostedCheckoutParams = (
  callToAction: string,
  acceptedPaymentMethods: string,
  paymentName: unknown,
): ErrorResponse | null => {
  if (callToAction && !common.CTA_TYPES.includes(callToAction)) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      `callToAction must be one of ${common.CTA_TYPES.join(', ')}`,
    );
  }
  if (acceptedPaymentMethods && !common.PAYMENT_METHOD_CONFIGS.includes(acceptedPaymentMethods)) {
    return handleTypedError(
      ErrorType.INVALID_PARAM,
      `acceptedPaymentMethods must be one of ${common.PAYMENT_METHOD_CONFIGS.join(', ')}`,
    );
  }
  if (!validate(paymentName, 'string')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'paymentName must be a string');
  }
  return null;
};

// Validate the details passed in for a transaction or redirect button
const validTransactionParams = (
  props: ModifiedTransactProps | ModifiedCheckoutDetails,
): ErrorResponse | null => {
  const { amount, payorInfo = {}, metadata, payTheoryData, feeMode } = props;
  //validate the input param types
  let error = isvalidTransactParams(amount, payorInfo, metadata);
  if (error) return error;
  //validate the amount
  error = isValidAmount(amount);
  if (error) return error;
  //validate the payorInfo
  error = isValidPayorInfo(payorInfo);
  if (error) return error;
  // validate the payorId
  error = isValidPayorDetails(payorInfo, payTheoryData.payor_id);
  if (error) return error;
  // validate the fee mode
  error = isValidFeeMode(feeMode);
  if (error) return error;
  // validate the invoice and recurring id
  error = isValidInvoiceAndRecurringId(payTheoryData);
  if (error) return error;
  // validate the billing info
  error = isValidBillingInfo(payTheoryData.billing_info);
  if (error) return error;
  // validate the L3 data summary
  error = isValidL3DataSummary(props.level3DataSummary);
  if (error) return error;
  // validate the Health Expense Type
  error = isValidHealthExpenseType(props.healthExpenseType);
  if (error) return error;
  // validate the fee
  return isValidFeeAmount(payTheoryData.fee);
};

const validQRSize = (size: unknown): ErrorResponse | null => {
  if (!validate(size, 'number')) {
    return handleTypedError(ErrorType.INVALID_PARAM, 'size must be a number');
  }
  return null;
};

export {
  checkInitialParams,
  findCardNumberError,
  findCombinedCardError,
  findAchError,
  findCardError,
  findCashError,
  findEftError,
  formatPayorObject,
  validate,
  isValidAmount,
  isvalidTransactParams,
  isValidTokenizeParams,
  isValidPayorInfo,
  isValidPayorDetails,
  isValidFeeMode,
  isValidInvoiceAndRecurringId,
  isValidFeeAmount,
  isValidBillingInfo,
  validTransactionParams,
  validateHostedCheckoutParams,
  validQRSize,
};
