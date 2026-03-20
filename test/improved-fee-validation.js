/**
 * This file contains an improved implementation of the fee validation function
 * that maintains type safety while allowing undefined values.
 *
 * To use this, replace the isValidFeeAmount function in src/field-set/validation.ts
 * with this implementation.
 */

import { ErrorType } from './mocks/data.js';

/**
 * Validates that a fee is either undefined or a positive number
 * This implementation maintains strict type checking while allowing undefined values
 *
 * @param {unknown} fee - The fee to validate
 * @returns {object|null} - Returns null if valid, or an error object if invalid
 */
const isValidFeeAmount = fee => {
  // Allow undefined fees
  if (fee === undefined) {
    return null;
  }

  // Only allow actual number types and ensure they're non-negative
  if (typeof fee === 'number' && fee >= 0) {
    return null;
  }

  // Return error for all other cases
  return {
    type: ErrorType.INVALID_PARAM,
    message: 'fee must be a positive integer',
  };
};

export { isValidFeeAmount };
