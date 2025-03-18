import { expect } from '@open-wc/testing';

// Immediate console log before any tests run
console.log('========= BASIC TEST FILE LOADED =========');

// Global timeout for all tests in this file
const TEST_TIMEOUT = 3000;

describe('Basic test to determine hangup cause', function () {
  // Set timeout for the entire test suite
  this.timeout(TEST_TIMEOUT);

  // Runs before all tests
  before(function () {
    console.log('BASIC TEST: before hook running');
  });

  // Simple synchronous test to demonstrate it works
  it('should run a simple test', function () {
    console.log('BASIC TEST: running simple test');
    expect(true).to.be.true;
    console.log('BASIC TEST: simple test completed');
  });

  // Test with a manual timeout to ensure completion
  it('should complete with a forced timeout', function (done) {
    console.log('BASIC TEST: starting timeout test');

    // Force completion after 1 second
    setTimeout(() => {
      console.log('BASIC TEST: timeout test completed');
      done();
    }, 1000);
  });

  // Runs after all tests
  after(function () {
    console.log('BASIC TEST: after hook running');
    console.log('========= BASIC TEST COMPLETED =========');
  });
});
