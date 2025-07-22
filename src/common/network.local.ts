// Local development configuration overrides

export const isLocalDevelopment = (): boolean => {
  // Check multiple conditions for local development
  return process.env.LOCAL_DEV === 'true';
};

export const getHostedFieldsEndpoint = (): string => {
  if (isLocalDevelopment()) {
    // Point to local secure-tags-lib development server
    return 'https://localhost:3001';
    // Alternative for HTTP: return 'http://localhost:3001';
  }

  // Use existing production logic
  const PARTNER = process.env.ENV;
  const STAGE = process.env.STAGE;
  const TARGET_MODE = process.env.TARGET_MODE;
  const ENVIRONMENT = `${PARTNER}${TARGET_MODE}`;
  return `https://${ENVIRONMENT}.tags.static.${STAGE}.com`;
};

export const getTransactionEndpoint = (): string => {
  // Always use deployed transaction service for now
  // Could be made configurable for local backend development in the future
  const PARTNER = process.env.ENV || 'paytheory';
  const STAGE = process.env.STAGE || 'api';
  const TARGET_MODE = process.env.TARGET_MODE || '';
  const ENVIRONMENT = `${PARTNER}${TARGET_MODE}`;
  return `https://${ENVIRONMENT}.${STAGE}.com/pt-token-service/`;
};

export const getHostedCheckoutEndpoint = (): string => {
  // Always use deployed checkout service
  const PARTNER = process.env.ENV || 'paytheory';
  const STAGE = process.env.STAGE || 'checkout';
  const TARGET_MODE = process.env.TARGET_MODE || '';
  const ENVIRONMENT = `${PARTNER}${TARGET_MODE}`;
  return `https://${ENVIRONMENT}.${STAGE}.com`;
};

// WebSocket endpoints remain pointing to deployed infrastructure
export const getWebSocketEndpoint = (): string => {
  // Always use deployed WebSocket service
  // Implementation depends on how WebSocket URLs are currently configured
  // This would need to be implemented based on current WebSocket configuration
  return ''; // TODO: Implement based on current WebSocket configuration if needed
};
