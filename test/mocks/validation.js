/**
 * Mock version of the validation module for testing
 */

import { ErrorType } from './data.js';

/**
 * Mock implementation of the isValidFeeAmount function
 */
export function isValidFeeAmount(fee) {
  // Allow undefined
  if (fee === undefined) {
    return null;
  }

  // Special handling for arrays: should be invalid
  if (Array.isArray(fee)) {
    return {
      type: ErrorType.INVALID_PARAM,
      message: 'fee must be a positive integer',
    };
  }

  // Allow zero or positive numbers and other values that convert to positive numbers
  if (fee == 0 || fee > 0) {
    return null;
  }

  // Return error for negative values or things that don't convert to numbers
  return {
    type: ErrorType.INVALID_PARAM,
    message: 'fee must be a positive integer',
  };
}
