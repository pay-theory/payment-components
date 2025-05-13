# Tags Secure Socket Implementation Guide

## Overview

The `tags-secure-socket` is a critical backend WebSocket service that securely processes payment data received from the secure payment fields. It serves as the communication channel between the hosted payment fields and the payment processing systems.

## Architecture Principles

1. **Security First**: Authentication and encryption at multiple levels
2. **Stateless Token Validation**: JWT-based token validation
3. **Message-Based Architecture**: Structured message protocols for all operations
4. **Error Resilience**: Graceful handling of connection issues and invalid messages

## Component Structure

```
tags-secure-socket/
├── src/
│   ├── server/              # Main WebSocket server
│   │   ├── index.ts         # Server entry point
│   │   ├── socket.ts        # WebSocket handling
│   │   └── metrics.ts       # Performance monitoring
│   ├── auth/                # Authentication and security
│   │   ├── token.ts         # JWT validation
│   │   ├── session.ts       # Session management
│   │   └── permissions.ts   # Permission checking
│   ├── handlers/            # Message handlers
│   │   ├── payment.ts       # Payment processing
│   │   ├── tokenize.ts      # Card tokenization
│   │   └── status.ts        # Status updates
│   ├── integrations/        # Payment processor integrations
│   │   ├── processors/      # Different payment processors
│   │   ├── adapters/        # Standardized interfaces
│   │   └── mock.ts          # Mock implementations for testing
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Logging utilities
│   │   ├── encryption.ts    # Data encryption/decryption
│   │   └── validation.ts    # Data validation
│   └── config/              # Configuration management
│       ├── environment.ts   # Environment-specific settings
│       └── defaults.ts      # Default configurations
└── ...
```

## Secure Connection Flow

The secure socket API implements a sophisticated connection flow to ensure secure communications:

1. **Initial Connection**:
   - The transacting field establishes a WebSocket connection using a valid PT Token
   - The token includes API key, merchant identity, and session key

2. **Token Validation**:
   - The secure socket validates the PT Token
   - If invalid, access is denied and an unauthorized error is returned
   - If valid, the process continues to host token creation

3. **Host Token Generation**:
   - The socket service creates a host token for the field
   - This host token is tied to the merchant ID and session key
   - The host token is sent back to the field

4. **Location Service Integration**:
   - The socket subscribes to incoming location updates
   - The Location Service verifies profile permissions
   - If the profile is allowed, a 200 response is sent
   - If not allowed, access is denied

5. **Socket Session Reuse**:
   - When socket timeouts occur, the system reuses the same session key
   - This maintains security while preventing unnecessary reconnections

6. **Sibling Token Flow**:
   - After the main field is connected, it can request tokens for sibling fields
   - The main field posts the host token to sibling fields
   - Sibling fields validate the token
   - If valid, they create their own secure sessions

### Key Security Features

- Host sessions use the key provided by the SDK payment components
- Session keys are tied to merchant ID and page session
- Only one session is created per SDK load
- The Location Service integration provides an additional authorization layer

## Token Validation

The WebSocket connection is authenticated using JWT tokens, which should be validated on connection:

```typescript
import * as jwt from 'jsonwebtoken';

// Validate JWT token passed in the connection URL
function validateToken(token: string): Promise<TokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        return reject(new Error('Invalid token'));
      }
      
      // Check if token is expired
      const payload = decoded as TokenPayload;
      if (Date.now() >= payload.exp * 1000) {
        return reject(new Error('Token expired'));
      }
      
      // Additional validation (e.g., check merchant ID, allowed origins)
      if (!isValidMerchant(payload.merchant_uid)) {
        return reject(new Error('Invalid merchant'));
      }
      
      resolve(payload);
    });
  });
}

// Token payload structure
interface TokenPayload {
  merchant_uid: string;
  origin: string;
  session_key: string;
  exp: number;
  // Other claims
  [key: string]: any;
}
```

## WebSocket Server Implementation

The WebSocket server should handle connections, message routing, and error handling:

```typescript
import * as WebSocket from 'ws';
import * as http from 'http';
import { URL } from 'url';
import { validateToken } from './auth/token';
import { handleMessage } from './handlers';
import { logger } from './utils/logger';

// Initialize the WebSocket server
export function initializeWebSocketServer(server: http.Server): WebSocket.Server {
  const wss = new WebSocket.Server({ 
    server,
    verifyClient: verifyClientConnection 
  });
  
  wss.on('connection', handleConnection);
  
  return wss;
}

// Verify client connection
async function verifyClientConnection(
  info: { origin: string; secure: boolean; req: http.IncomingMessage },
  callback: (verified: boolean, code?: number, message?: string) => void
): Promise<void> {
  try {
    // Extract token from URL query parameters
    const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
    const token = url.searchParams.get('pt_token');
    
    if (!token) {
      return callback(false, 401, 'Token missing');
    }
    
    // Validate token
    const payload = await validateToken(token);
    
    // Store the payload on the request for later use
    (info.req as any).tokenPayload = payload;
    
    // Validate origin against token's allowed origin
    if (info.origin !== payload.origin) {
      return callback(false, 403, 'Origin mismatch');
    }
    
    callback(true);
  } catch (error) {
    logger.error('Connection verification failed', error);
    callback(false, 401, 'Invalid token');
  }
}

// Handle new WebSocket connections
function handleConnection(ws: WebSocket, req: http.IncomingMessage): void {
  // Extract validated token payload
  const payload = (req as any).tokenPayload;
  
  logger.info(`New connection established for merchant: ${payload.merchant_uid}`);
  
  // Set up connection context
  const context = {
    merchantId: payload.merchant_uid,
    sessionKey: payload.session_key,
    origin: payload.origin,
    // Other context properties
  };
  
  // Save context with the WebSocket
  (ws as any).context = context;
  
  // Set up message handler
  ws.on('message', (message: WebSocket.Data) => {
    handleSocketMessage(ws, message, context);
  });
  
  // Set up error handler
  ws.on('error', (error) => {
    logger.error(`WebSocket error for merchant ${context.merchantId}:`, error);
  });
  
  // Set up close handler
  ws.on('close', (code, reason) => {
    logger.info(`Connection closed for merchant ${context.merchantId}: ${code} ${reason}`);
  });
  
  // Send initial connection acknowledgement
  ws.send(JSON.stringify({
    type: 'connection_established',
    merchant_uid: payload.merchant_uid,
    timestamp: Date.now()
  }));
}

// Handle incoming WebSocket messages
async function handleSocketMessage(
  ws: WebSocket, 
  message: WebSocket.Data, 
  context: ConnectionContext
): Promise<void> {
  try {
    // Parse message
    const data = JSON.parse(message.toString());
    
    // Basic message validation
    if (!data.action) {
      return sendError(ws, 'Invalid message format: missing action');
    }
    
    // Route message to appropriate handler
    const response = await handleMessage(data, context);
    
    // Send response back to client
    ws.send(JSON.stringify(response));
  } catch (error) {
    logger.error('Error handling message:', error);
    sendError(ws, 'Error processing message');
  }
}

// Send error message
function sendError(ws: WebSocket, message: string): void {
  ws.send(JSON.stringify({
    type: 'error',
    message,
    timestamp: Date.now()
  }));
}
```

## Payment Processing Flow

The Card/ACH payment processing flow follows a structured sequence:

1. **Transaction Initiation**:
   - Client initiates a payment transaction
   - The SDK validates fields and sends payment details
   - The transactional field receives the request

2. **Challenge Token Acquisition**:
   - The field gets a challenge token from the secure socket
   - If the token is invalid, an error is thrown and reported back

3. **Payment Parameter Verification**:
   - The system checks if the merchant is valid
   - It retrieves payment parameters from the Payment Profile Service
   - These parameters define allowed payment methods and configurations

4. **Payment Intent Processing**:
   - The field formats the payment request
   - It validates the payment through historical checks
   - The system processes the payment intent through the processor object

5. **Payment Identity Resolution**:
   - The system retrieves merchant identity from the Merchant Identity Service
   - It calculates applicable fees based on merchant configuration
   - A payment token and record number are generated

6. **Completion Handling**:
   - If successful, a payment token is returned
   - The client receives a token and can now confirm the payment
   - Session history is updated in the database

7. **Confirmation Flow**:
   - The merchant can confirm the payment to finalize it
   - This triggers a capture of the payment
   - Status updates are sent to all relevant systems

8. **Cancellation Option**:
   - Alternatively, the merchant can cancel the payment
   - The system will update the payment status accordingly
   - All entities are notified of the cancellation

### Error Handling Throughout Flow

At each step, errors are captured and handled appropriately:
- Invalid fields result in validation errors
- Authorization failures result in denied access
- Processing errors are logged and reported
- Network failures trigger retry mechanisms
- System errors are sent to monitoring services

## Message Handlers

Implement handlers for different message types:

```typescript
// Message handler router
export async function handleMessage(
  message: any, 
  context: ConnectionContext
): Promise<any> {
  // Log incoming message (excluding sensitive data)
  logger.debug('Handling message', { 
    action: message.action,
    merchantId: context.merchantId
  });
  
  // Route to appropriate handler based on action
  switch (message.action) {
    case 'host:hostToken':
      return handleHostTokenRequest(message, context);
    
    case 'process_payment':
      return handlePaymentRequest(message, context);
      
    case 'tokenize_payment_method':
      return handleTokenizationRequest(message, context);
      
    case 'confirm_payment':
      return handleConfirmationRequest(message, context);
      
    default:
      throw new Error(`Unsupported action: ${message.action}`);
  }
}

// Host token handler
async function handleHostTokenRequest(
  message: any, 
  context: ConnectionContext
): Promise<any> {
  // Generate host token for secure connection
  const hostToken = await generateHostToken(context);
  
  // Return host token response
  return {
    type: 'host_token',
    host_token: hostToken,
    session_key: context.sessionKey,
    timestamp: Date.now()
  };
}

// Payment processing handler
async function handlePaymentRequest(
  message: any, 
  context: ConnectionContext
): Promise<any> {
  // Validate message data
  validatePaymentData(message.data);
  
  // Process payment through appropriate processor
  const processor = getPaymentProcessor(context.merchantId);
  const result = await processor.processPayment({
    amount: message.data.amount,
    paymentMethod: message.data.paymentMethod,
    // Other payment details
  });
  
  // Return payment response
  return {
    type: 'payment_result',
    requestId: message.requestId,
    result,
    timestamp: Date.now()
  };
}
```

## Payment Processor Integration

Create adapters for different payment processors:

```typescript
// Payment processor interface
interface PaymentProcessor {
  processPayment(data: PaymentData): Promise<PaymentResult>;
  tokenizePaymentMethod(data: any): Promise<TokenizationResult>;
  capturePayment(transactionId: string): Promise<CaptureResult>;
  voidPayment(transactionId: string): Promise<VoidResult>;
}

// Payment processor factory
function getPaymentProcessor(merchantId: string): PaymentProcessor {
  // Get merchant configuration
  const merchantConfig = getMerchantConfiguration(merchantId);
  
  // Create the appropriate processor based on merchant configuration
  switch (merchantConfig.processor) {
    case 'stripe':
      return new StripeProcessor(merchantConfig.processorConfig);
      
    case 'braintree':
      return new BraintreeProcessor(merchantConfig.processorConfig);
      
    // Other processors
    
    default:
      throw new Error(`Unsupported payment processor: ${merchantConfig.processor}`);
  }
}

// Example processor implementation
class StripeProcessor implements PaymentProcessor {
  private apiKey: string;
  
  constructor(config: any) {
    this.apiKey = config.apiKey;
  }
  
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    // Implement Stripe payment processing
    // Use Stripe SDK to create a payment intent
    // Return standardized result
  }
  
  async tokenizePaymentMethod(data: any): Promise<TokenizationResult> {
    // Implement Stripe tokenization
  }
  
  async capturePayment(transactionId: string): Promise<CaptureResult> {
    // Implement payment capture
  }
  
  async voidPayment(transactionId: string): Promise<VoidResult> {
    // Implement payment voiding
  }
}
```

## Error Handling

Implement robust error handling:

```typescript
// Error types
enum ErrorCode {
  INVALID_REQUEST = 'invalid_request',
  AUTHENTICATION_ERROR = 'authentication_error',
  PROCESSING_ERROR = 'processing_error',
  VALIDATION_ERROR = 'validation_error',
  SYSTEM_ERROR = 'system_error'
}

// Standard error response
interface ErrorResponse {
  type: 'error';
  code: ErrorCode;
  message: string;
  requestId?: string;
  timestamp: number;
}

// Error handling function
function handleError(error: any, requestId?: string): ErrorResponse {
  // Log the error
  logger.error('Operation error:', error);
  
  // Determine error type
  let code = ErrorCode.SYSTEM_ERROR;
  let message = 'An unexpected error occurred';
  
  if (error instanceof ValidationError) {
    code = ErrorCode.VALIDATION_ERROR;
    message = error.message;
  } else if (error instanceof AuthenticationError) {
    code = ErrorCode.AUTHENTICATION_ERROR;
    message = 'Authentication failed';
  } else if (error instanceof ProcessingError) {
    code = ErrorCode.PROCESSING_ERROR;
    message = 'Payment processing failed';
  }
  
  // Create standardized error response
  return {
    type: 'error',
    code,
    message,
    requestId,
    timestamp: Date.now()
  };
}
```

## Security Implementation

Implement security measures throughout the service:

```typescript
// Encrypt sensitive data
function encryptSensitiveData(data: any): string {
  // Use strong encryption algorithm
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return encrypted data with IV and auth tag
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted,
    tag: authTag.toString('hex')
  });
}

// Decrypt sensitive data
function decryptSensitiveData(encryptedData: string): any {
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  
  const { iv, data, tag } = JSON.parse(encryptedData);
  
  const decipher = crypto.createDecipheriv(
    algorithm, 
    key, 
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}
```

## Logging and Monitoring

Implement comprehensive logging and monitoring:

```typescript
// Configure structured logger
import * as winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'tags-secure-socket' },
  transports: [
    new winston.transports.Console(),
    // Add additional transports for production
  ]
});

// Sensitive data filtering
logger.filters.push((level, msg, meta) => {
  if (meta) {
    // Create a deep copy
    const filteredMeta = JSON.parse(JSON.stringify(meta));
    
    // Remove sensitive fields
    const sensitiveFields = ['cardNumber', 'cvv', 'accountNumber', 'routingNumber'];
    for (const field of sensitiveFields) {
      if (filteredMeta[field]) {
        filteredMeta[field] = '[REDACTED]';
      }
    }
    
    return { level, msg, meta: filteredMeta };
  }
  return { level, msg, meta };
});

// Performance monitoring
export function monitorOperation(operationName: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        
        // Record operation metrics
        recordMetric(operationName, duration, true);
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        // Record operation failure
        recordMetric(operationName, duration, false);
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Record operation metrics
function recordMetric(
  operation: string, 
  durationMs: number, 
  success: boolean
): void {
  // In a real implementation, send to a metrics service
  logger.debug('Operation metrics', {
    operation,
    durationMs,
    success
  });
}
```

## Health Checks and Monitoring

Implement health checks:

```typescript
import * as http from 'http';

// Health check endpoint
function setupHealthChecks(server: http.Server): void {
  server.on('request', (req, res) => {
    if (req.url === '/health') {
      // Check system health
      const isHealthy = checkSystemHealth();
      
      if (isHealthy) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy' }));
      } else {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'unhealthy' }));
      }
    }
  });
}

// Check overall system health
function checkSystemHealth(): boolean {
  // Check database connection
  const dbHealthy = checkDatabaseHealth();
  
  // Check payment processor connections
  const processorsHealthy = checkPaymentProcessorsHealth();
  
  // Check other system dependencies
  
  return dbHealthy && processorsHealthy;
}
```

## Deployment Considerations

Consider these key deployment aspects:

1. **Scaling**: Use load balancing and auto-scaling for handling varying traffic
2. **High Availability**: Deploy across multiple availability zones
3. **Connection Persistence**: Support WebSocket connection persistence
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Monitoring**: Set up comprehensive monitoring and alerts

## Security Considerations

1. **Token Security**: Use short-lived tokens with proper signing
2. **Origin Validation**: Strictly validate connection origins
3. **Data Encryption**: Encrypt sensitive data in transit and at rest
4. **Input Validation**: Validate all incoming messages rigorously
5. **Rate Limiting**: Implement rate limiting to prevent brute force attempts
6. **Logging**: Maintain comprehensive audit logs
7. **Penetration Testing**: Regularly test for security vulnerabilities 