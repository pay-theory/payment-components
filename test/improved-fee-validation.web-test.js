import { expect } from '@esm-bundle/chai';
import { spy } from 'sinon';

// Import the improved fee validation implementation
import { isValidFeeAmount } from './improved-fee-validation.js';
import { ErrorType } from './mocks/data.js';

// Define test cases for better maintainability
const VALID_FEE_TEST_CASES = [
  { name: 'undefined', value: undefined, description: 'Undefined values should be valid' },
  { name: 'zero', value: 0, description: 'Zero fees should be valid' },
  { name: 'positive number', value: 100, description: 'Positive numbers should be valid' },
];

const INVALID_FEE_TEST_CASES = [
  { name: 'negative number', value: -10, description: 'Negative numbers should be invalid' },
  {
    name: 'string values',
    value: '100',
    description: 'String values should be invalid even if they convert to numbers',
  },
  { name: 'boolean true', value: true, description: 'Boolean values should not be accepted' },
  { name: 'boolean false', value: false, description: 'Boolean values should not be accepted' },
  {
    name: 'negative string',
    value: '-10',
    description: 'Negative string values should be invalid',
  },
  {
    name: 'non-numeric string',
    value: 'abc',
    description: 'Non-numeric strings should be invalid',
  },
  { name: 'object', value: {}, description: 'Objects should be invalid' },
  { name: 'array', value: [], description: 'Arrays should be invalid' },
  { name: 'null', value: null, description: 'Null should be invalid' },
];

describe('Improved Fee Validation', () => {
  // Using beforeEach for any test setup
  let errorSpy;

  beforeEach(() => {
    // Spy on console error if needed
    errorSpy = spy(console, 'error');
  });

  afterEach(() => {
    errorSpy.restore();
  });

  // Testing valid cases with a loop
  VALID_FEE_TEST_CASES.forEach(({ name, value, description }) => {
    it(`should accept ${name} fees - ${description}`, async () => {
      const result = isValidFeeAmount(value);
      expect(result).to.be.null;
    });
  });

  // Testing invalid cases with a loop
  INVALID_FEE_TEST_CASES.forEach(({ name, value, description }) => {
    it(`should reject ${name} - ${description}`, async () => {
      const result = isValidFeeAmount(value);
      expect(result).to.not.be.null;
      expect(result.type).to.equal(ErrorType.INVALID_PARAM);
      expect(result.message).to.equal('fee must be a positive integer');
    });
  });

  // Advanced test that demonstrates grouping
  describe('Edge Cases', () => {
    it('should handle very large numbers', async () => {
      const result = isValidFeeAmount(Number.MAX_SAFE_INTEGER);
      expect(result).to.be.null;
    });

    it('should handle floating point numbers', async () => {
      const result = isValidFeeAmount(10.5);
      // Floating point numbers are valid as long as they're positive
      expect(result).to.be.null;
    });
  });
});
