/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from '@open-wc/testing';
import { isValidFeeAmount } from './improved-fee-validation';
import { ErrorType } from '../src/common/data';

describe('Improved Fee Validation Tests', () => {
  it('should accept undefined fees', () => {
    const result = isValidFeeAmount(undefined);
    expect(result).to.be.null;
  });

  it('should accept zero fees', () => {
    const result = isValidFeeAmount(0);
    expect(result).to.be.null;
  });

  it('should accept positive number fees', () => {
    const result = isValidFeeAmount(100);
    expect(result).to.be.null;
  });

  it('should reject negative fees', () => {
    const result = isValidFeeAmount(-10);
    expect(result).to.not.be.null;
    expect(result.type).to.equal(ErrorType.INVALID_PARAM);
    expect(result.message).to.equal('fee must be a positive integer');
  });

  it('should reject string values that convert to positive numbers', () => {
    // This is different from the current implementation
    // The improved version maintains type safety
    const result = isValidFeeAmount('100');
    expect(result).to.not.be.null;
    expect(result.type).to.equal(ErrorType.INVALID_PARAM);
    expect(result.message).to.equal('fee must be a positive integer');
  });

  it('should reject boolean true', () => {
    // This is different from the current implementation
    // The improved version maintains type safety
    const result = isValidFeeAmount(true);
    expect(result).to.not.be.null;
    expect(result.type).to.equal(ErrorType.INVALID_PARAM);
    expect(result.message).to.equal('fee must be a positive integer');
  });

  it('should reject boolean false', () => {
    // This is different from the current implementation
    // The improved version maintains type safety
    const result = isValidFeeAmount(false);
    expect(result).to.not.be.null;
    expect(result.type).to.equal(ErrorType.INVALID_PARAM);
    expect(result.message).to.equal('fee must be a positive integer');
  });

  it('should reject string values that convert to negative numbers', () => {
    const result = isValidFeeAmount('-10');
    expect(result).to.not.be.null;
    expect(result.type).to.equal(ErrorType.INVALID_PARAM);
    expect(result.message).to.equal('fee must be a positive integer');
  });

  it('should reject non-numeric strings', () => {
    const result = isValidFeeAmount('abc');
    expect(result).to.not.be.null;
    expect(result.type).to.equal(ErrorType.INVALID_PARAM);
    expect(result.message).to.equal('fee must be a positive integer');
  });

  it('should reject objects', () => {
    const result = isValidFeeAmount({});
    expect(result).to.not.be.null;
    expect(result.type).to.equal(ErrorType.INVALID_PARAM);
    expect(result.message).to.equal('fee must be a positive integer');
  });

  it('should reject arrays', () => {
    const result = isValidFeeAmount([]);
    expect(result).to.not.be.null;
    expect(result.type).to.equal(ErrorType.INVALID_PARAM);
    expect(result.message).to.equal('fee must be a positive integer');
  });

  it('should reject null', () => {
    const result = isValidFeeAmount(null);
    expect(result).to.not.be.null;
    expect(result.type).to.equal(ErrorType.INVALID_PARAM);
    expect(result.message).to.equal('fee must be a positive integer');
  });
});
