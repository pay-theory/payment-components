/**
 * Runtime values used by the SDK implementation when constructing and validating public values.
 *
 * Partner-facing type definitions belong in `../paytheory-sdk.ts`. Keeping this module limited to
 * runtime values prevents the implementation from growing a second definition of the public
 * contract while preserving the existing property-based constant access.
 */
import type {
  ErrorType as PublicErrorType,
  HealthExpenseType as PublicHealthExpenseType,
  ResponseMessageType,
  TaxIndicatorType as PublicTaxIndicatorType,
} from '../paytheory-sdk';

type RuntimeValues<TValue extends string> = { [Value in TValue]: Value };

/** Runtime response discriminators used when constructing SDK results. */
export const ResponseMessageTypes = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  CONFIRMATION: 'CONFIRMATION',
  FAILED: 'FAILED',
  CASH: 'CASH',
  TOKENIZED: 'TOKENIZED',
  READY: 'READY',
} as const satisfies RuntimeValues<ResponseMessageType>;

/** Runtime error categories used to prefix SDK error messages. */
export const ErrorType = {
  NO_FIELDS: 'NO_FIELDS',
  NOT_VALID: 'NOT_VALID',
  INVALID_PARAM: 'INVALID_PARAM',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NO_TOKEN: 'NO_TOKEN',
  FIELD_ERROR: 'FIELD_ERROR',
  CANCEL_FAILED: 'CANCEL_FAILED',
  ACTION_COMPLETE: 'ACTION_COMPLETE',
  ACTION_IN_PROGRESS: 'ACTION_IN_PROGRESS',
  TRANSACTING_FIELD_ERROR: 'TRANSACTING_FIELD_ERROR',
  SOCKET_ERROR: 'SOCKET_ERROR',
  NOT_READY: 'NOT_READY',
} as const satisfies RuntimeValues<PublicErrorType>;

/** Runtime values accepted for Level 3 tax indicators. */
export const TaxIndicatorType = {
  TAX_AMOUNT_PROVIDED: 'TAX_AMOUNT_PROVIDED',
  NOT_TAXABLE: 'NOT_TAXABLE',
  NO_TAX_INFO_PROVIDED: 'NO_TAX_INFO_PROVIDED',
} as const satisfies RuntimeValues<PublicTaxIndicatorType>;

/** Runtime values accepted for healthcare expense categories. */
export const HealthExpenseType = {
  HEALTHCARE: 'HEALTHCARE',
  RX: 'RX',
  VISION: 'VISION',
  CLINICAL: 'CLINICAL',
  COPAY: 'COPAY',
  DENTAL: 'DENTAL',
  TRANSIT: 'TRANSIT',
} as const satisfies RuntimeValues<PublicHealthExpenseType>;
