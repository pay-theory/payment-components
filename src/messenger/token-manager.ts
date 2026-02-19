import { fetchCheckoutPtToken, fetchPtToken } from '../common/network';
import type { CheckoutContextQuery } from '../common/pay_theory_types';

type TokenManagerAuth =
  | { apiKey: string; checkoutContext?: never }
  | { apiKey?: never; checkoutContext: CheckoutContextQuery };

class TokenManager {
  private auth: TokenManagerAuth;
  private sessionId: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private tokenFetchPromise: Promise<string> | null = null;

  constructor(auth: TokenManagerAuth, sessionId: string) {
    this.auth = auth;
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

      // Set token expiry based on JWT exp (seconds since epoch)
      this.tokenExpiry = this.getTokenExpiryMs(token);

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
      const result =
        'apiKey' in this.auth
          ? await fetchPtToken(this.auth.apiKey, this.sessionId)
          : await fetchCheckoutPtToken(this.auth.checkoutContext, this.sessionId);

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

  private getTokenExpiryMs(token: string): number {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return Date.now() + 4 * 60 * 1000;

      const payloadB64Url = parts[1];
      const base64 = payloadB64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

      if (typeof atob !== 'function') return Date.now() + 4 * 60 * 1000;
      const json = atob(padded);

      const payload = JSON.parse(json) as { exp?: number };
      const expSeconds = payload.exp;
      if (!expSeconds || typeof expSeconds !== 'number') return Date.now() + 4 * 60 * 1000;

      // Refresh 10 seconds before expiry to avoid clock skew
      return expSeconds * 1000 - 10 * 1000;
    } catch {
      return Date.now() + 4 * 60 * 1000;
    }
  }

  /**
   * Cleanup method to clear stored tokens and pending promises
   */
  cleanup(): void {
    this.token = null;
    this.tokenExpiry = 0;
    this.tokenFetchPromise = null;
  }
}

export default TokenManager;
