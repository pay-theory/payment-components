/**
 * Mock version of the data module for testing
 */

// Mock the ErrorType enum
export const ErrorType = {
  UNKNOWN: 'UNKNOWN',
  INVALID_PARAM: 'INVALID_PARAM',
  INVALID_STATE: 'INVALID_STATE',
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  GATEWAY: 'GATEWAY',
};

// Mock the removeAll function
export function removeAll() {
  // Mock implementation
  return true;
}

// Add other data exports that might be needed for tests
