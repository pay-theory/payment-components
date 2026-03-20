/**
 * Retry utility with exponential backoff support
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
}

/**
 * Execute an operation with exponential backoff retry logic
 * @param operation - The async operation to execute
 * @param shouldRetry - Function to determine if the result should trigger a retry
 * @param options - Configuration options for retry behavior
 * @returns The successful result or null if all retries failed
 */
export const withExponentialBackoff = async <T>(
  operation: () => Promise<T>,
  shouldRetry: (result: T) => boolean,
  options: RetryOptions = {},
): Promise<T | null> => {
  const {
    maxAttempts = 5,
    initialDelay = 100,
    maxDelay = 5000,
    backoffFactor = 2,
    jitter = true,
  } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await operation();

      if (!shouldRetry(result)) {
        return result;
      }

      // If we should retry and this isn't the last attempt, wait before retrying
      if (attempt < maxAttempts - 1) {
        const baseDelay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);
        const delay = jitter ? baseDelay * (0.5 + Math.random() * 0.5) : baseDelay;

        console.log(`Retry attempt ${attempt + 1}/${maxAttempts} - waiting ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      // If operation throws, we should also retry (unless it's the last attempt)
      console.error(`Operation failed on attempt ${attempt + 1}:`, error);

      if (attempt < maxAttempts - 1) {
        const baseDelay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);
        const delay = jitter ? baseDelay * (0.5 + Math.random() * 0.5) : baseDelay;

        console.log(`Error retry ${attempt + 1}/${maxAttempts} - waiting ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Re-throw on last attempt
        throw error;
      }
    }
  }

  return null;
};

/**
 * Simple delay utility for non-exponential waits
 * @param ms - Milliseconds to wait
 */
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
