/**
 * Endpoint configuration for local SDK integrations.
 *
 * Design rule:
 * `LOCAL_DEV` controls SDK runtime mode (webpack/dev server), while endpoint routing is controlled
 * explicitly via `LOCAL_HOSTED_FIELDS` and `LOCAL_HOSTED_CHECKOUT`.
 */

const LOCAL_HOSTED_FIELDS_DEFAULT_ENDPOINT = 'https://localhost:3001';
const LOCAL_HOSTED_CHECKOUT_DEFAULT_ENDPOINT = 'http://localhost:3002';

const readEnvString = (key: string): string | undefined => {
  const envRecord = process.env as Record<string, string | undefined>;
  const value = envRecord[key];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isEnvTrue = (key: string): boolean => readEnvString(key)?.toLowerCase() === 'true';

const normalizeEndpoint = (endpoint: string): string => endpoint.replace(/\/+$/, '');

const getEnvironment = () => {
  const partner = process.env.ENV;
  const stage = process.env.STAGE;
  const targetMode = process.env.TARGET_MODE || '';
  const environment = `${partner}${targetMode}`;
  return { environment, partner, stage, targetMode };
};

/**
 * Returns true when hosted fields iframes should point at a local dev server.
 */
export const isLocalHostedFieldsEnabled = (): boolean => isEnvTrue('LOCAL_HOSTED_FIELDS');

/**
 * Returns true when hosted checkout should point at a local dev server.
 */
export const isLocalHostedCheckoutEnabled = (): boolean => isEnvTrue('LOCAL_HOSTED_CHECKOUT');

/**
 * Resolve the hosted-fields base endpoint.
 */
export const getHostedFieldsEndpoint = (): string => {
  if (isLocalHostedFieldsEnabled()) {
    const endpoint = readEnvString('LOCAL_HOSTED_FIELDS_ENDPOINT');
    return normalizeEndpoint(endpoint || LOCAL_HOSTED_FIELDS_DEFAULT_ENDPOINT);
  }

  const { environment, stage } = getEnvironment();
  return `https://${environment}.tags.static.${stage}.com`;
};

/**
 * Resolve the PT token transaction endpoint.
 */
export const getTransactionEndpoint = (): string => {
  const { environment, stage } = getEnvironment();
  return `https://${environment}.${stage}.com/pt-token-service/`;
};

/**
 * Resolve the hosted checkout base endpoint.
 */
export const getHostedCheckoutEndpoint = (): string => {
  if (isLocalHostedCheckoutEnabled()) {
    const endpoint = readEnvString('LOCAL_HOSTED_CHECKOUT_ENDPOINT');
    return normalizeEndpoint(endpoint || LOCAL_HOSTED_CHECKOUT_DEFAULT_ENDPOINT);
  }

  const { environment, stage } = getEnvironment();
  return `https://${environment}.checkout.${stage}.com`;
};
