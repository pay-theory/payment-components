import { fetchPtToken } from '../common/network';

class TokenManager {
  private apiKey: string;
  private sessionId?: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private tokenFetchPromise: Promise<string> | null = null;

  constructor(apiKey: string, sessionId: string) {
    this.apiKey = apiKey;
    this.sessionId = sessionId;
  }

  /**
   * Get a valid token, fetching a new one if needed
   */
  async getToken(): Promise<string> {
    if (this.token && !this.isTokenExpired()) {
      return this.token;
    }

    return this.refreshToken();
  }

  /**
   * Fetch a new token from the server
   */
  async refreshToken(): Promise<string> {
    // If there's already a token fetch in progress, return that promise
    if (this.tokenFetchPromise) {
      return this.tokenFetchPromise;
    }

    // Create a new token fetch promise
    this.tokenFetchPromise = this.fetchTokenFromServer();

    try {
      const token = await this.tokenFetchPromise;
      this.token = token;

      // Set token expiry to 55 minutes (tokens typically valid for 1 hour)
      this.tokenExpiry = Date.now() + 55 * 60 * 1000;

      return token;
    } finally {
      this.tokenFetchPromise = null;
    }
  }

  /**
   * Check if the current token is expired
   */
  isTokenExpired(): boolean {
    return !this.token || Date.now() > this.tokenExpiry;
  }

  /**
   * Fetch a token from the server
   */
  private async fetchTokenFromServer(): Promise<string> {
    try {
      const result = await fetchPtToken(this.apiKey, this.sessionId);

      if (!result || !result['pt-token']) {
        throw new Error('Token not found in response');
      }

      return result['pt-token'];
    } catch (error) {
      throw new Error(
        `Token fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

export default TokenManager;
