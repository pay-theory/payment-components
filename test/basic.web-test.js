import { expect } from '@esm-bundle/chai';

describe('Basic Test Suite', () => {
  it('should pass a simple assertion', () => {
    expect(true).to.be.true;
  });

  it('should do basic math', () => {
    expect(1 + 1).to.equal(2);
  });

  it('should handle async tests', async () => {
    const result = await Promise.resolve(42);
    expect(result).to.equal(42);
  });
});
