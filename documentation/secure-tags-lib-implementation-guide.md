# Secure Tags Library Implementation Guide

## Overview

The `secure-tags-lib` is a critical component of PayTheory's payment infrastructure, running within secure iframes to collect and process sensitive payment information. This guide provides detailed implementation instructions for developers working on this library.

## Architecture Principles

1. **Security First**: All implementation decisions must prioritize security
2. **Encapsulation**: Sensitive data never leaves the secure iframe boundary
3. **Coordination**: Follow the hub-and-spoke model for iframe communication
4. **Conformity**: Adhere strictly to the established messaging protocol

## Component Structure

```
secure-tags-lib/
├── src/
│   ├── components/         # UI components
│   │   ├── base-field.ts   # Base field implementation
│   │   ├── card-number.ts  # Field-specific implementations
│   │   ├── card-exp.ts
│   │   └── ...
│   ├── services/
│   │   ├── websocket.ts    # WebSocket connection management
│   │   ├── validation.ts   # Field validation logic
│   │   └── messaging.ts    # Message handling
│   ├── utils/
│   │   ├── tokenization.ts # Token handling
│   │   ├── formatting.ts   # Input formatting utilities
│   │   └── security.ts     # Security utilities
│   ├── styles/             # CSS and styling
│   │   ├── main.css
│   │   └── themes/
│   └── index.ts            # Main entry point
└── ...
```

## Secure Connection Implementation

Based on the secure socket connection flow, implement the following sequence in the library:

1. **Initialization and Ready Notification**:
   ```typescript
   // On iframe load
   window.addEventListener('load', () => {
     // Get element type from configuration
     const elementType = getElementType();
     
     // Notify parent that the iframe is ready for a token
     window.parent.postMessage({
       type: 'pt-static:pt_token_ready',
       element: elementType
     }, '*');
     
     console.log('[PT Debug] Token ready message sent');
   });
   ```

2. **Connection Token Processing**:
   ```typescript
   // Listen for connection token from parent
   window.addEventListener('message', (event) => {
     // Validate origin
     if (!isValidOrigin(event.origin)) return;
     
     const message = event.data;
     
     // Handle connection token
     if (message.type === 'pt-static:connection_token') {
       handleConnectionToken(message);
     }
   });
   
   // Process connection token
   function handleConnectionToken(message) {
     const token = message.data.token;
     
     // For transactional fields, establish WebSocket connection
     if (isTransactionalField()) {
       connectToWebSocket(token)
         .then(requestHostToken)
         .then(() => {
           // Send connected message after host token is received
           window.parent.postMessage({
             type: 'pt-static:connected',
             element: getElementType()
           }, '*');
         })
         .catch(handleConnectionError);
     } else {
       // For sibling fields, just acknowledge connection
       window.parent.postMessage({
         type: 'pt-static:connected',
         element: getElementType()
       }, '*');
     }
   }
   ```

3. **WebSocket Connection**:
   ```typescript
   // Connect to WebSocket using PT token
   function connectToWebSocket(token) {
     return new Promise((resolve, reject) => {
       const wsUrl = `wss://secure.socket.paytheory.com/?pt_token=${token}`;
       const socket = new WebSocket(wsUrl);
       
       socket.onopen = () => {
         console.log('[PT Debug] WebSocket connection established');
         // Save socket for future use
         window.ptSocket = socket;
         resolve(socket);
       };
       
       socket.onerror = (error) => {
         console.error('[PT Debug] WebSocket connection error:', error);
         reject(error);
       };
       
       socket.onmessage = handleSocketMessage;
       socket.onclose = handleSocketClose;
     });
   }
   ```

4. **Host Token Request**:
   ```typescript
   // Request host token from socket service
   function requestHostToken() {
     return new Promise((resolve, reject) => {
       if (!window.ptSocket) {
         return reject(new Error('WebSocket not connected'));
       }
       
       // Create request ID for tracking response
       const requestId = generateUniqueId();
       
       // Setup one-time handler for this response
       const hostTokenHandler = (event) => {
         const data = JSON.parse(event.data);
         if (data.type === 'host_token' && data.requestId === requestId) {
           // Store host token for future use
           window.hostToken = data.host_token;
           window.ptSocket.removeEventListener('message', hostTokenHandler);
           resolve(data.host_token);
         }
       };
       
       window.ptSocket.addEventListener('message', hostTokenHandler);
       
       // Send host token request
       window.ptSocket.send(JSON.stringify({
         action: 'host:hostToken',
         requestId
       }));
     });
   }
   ```

## Field Types Implementation

### Base Field Class

All field types should extend from a common base class that implements:

```typescript
class BaseField {
  // Properties
  protected element: string;                // Element type identifier
  protected state: FieldState;              // Current field state
  protected connected: boolean = false;     // Connection status
  protected fieldElement: HTMLInputElement; // Input element

  // Methods
  constructor(element: string) {
    this.element = element;
    this.state = this.createInitialState();
    this.setupEventListeners();
  }
  
  // Create a complete state object - never return partial states
  protected createInitialState(): FieldState {
    return {
      valid: false,
      focus: false,
      empty: true,
      errorMessages: [],
      isDirty: false
    };
  }
  
  // Send state updates to parent
  protected sendStateUpdate(): void {
    if (!this.connected) return; // Don't send state before connection
    
    window.parent.postMessage({
      type: 'pt-static:state',
      element: this.element,
      state: this.state
    }, '*');
  }
  
  // Setup event listeners for the field
  protected setupEventListeners(): void {
    this.fieldElement.addEventListener('input', this.handleInput.bind(this));
    this.fieldElement.addEventListener('focus', this.handleFocus.bind(this));
    this.fieldElement.addEventListener('blur', this.handleBlur.bind(this));
    
    window.addEventListener('message', this.handleMessage.bind(this));
  }
  
  // Input event handler
  protected handleInput(event: Event): void {
    // Update state based on input
    // Validate field
    // Format input if needed
    this.sendStateUpdate();
  }
  
  // Handle incoming messages
  protected handleMessage(event: MessageEvent): void {
    // Validate origin
    if (!this.isValidOrigin(event.origin)) return;
    
    const message = event.data;
    
    // Handle connection token
    if (message.type === 'pt-static:connection_token') {
      this.handleConnectionToken(message);
    }
    
    // Handle other message types
  }
  
  // Connection token handler
  protected handleConnectionToken(message: any): void {
    // Process token
    // Establish connection if needed
    // Set connected status
    this.connected = true;
    
    // Send connected message
    window.parent.postMessage({
      type: 'pt-static:connected',
      element: this.element
    }, '*');
  }
}
```

### Transactional Field Implementation

For fields that need to establish a direct connection (like card number):

```typescript
class TransactionalField extends BaseField {
  private websocket: WebSocketService;
  
  constructor(element: string) {
    super(element);
    this.websocket = new WebSocketService();
  }
  
  // Override connection token handler to establish WebSocket
  protected handleConnectionToken(message: any): void {
    const token = message.data.token;
    
    // Establish WebSocket connection
    this.websocket.connect(token)
      .then(() => {
        this.connected = true;
        
        // Send connected message
        window.parent.postMessage({
          type: 'pt-static:connected',
          element: this.element
        }, '*');
      })
      .catch(error => {
        // Handle connection error
        window.parent.postMessage({
          type: 'pt-static:error',
          element: this.element,
          error: 'WebSocket connection error'
        }, '*');
      });
  }
  
  // Transaction handling methods
  processPayment(paymentData: any): Promise<any> {
    // Process payment through WebSocket
    return this.websocket.sendPayment(paymentData);
  }
}
```

### Sibling Field Implementation

For non-transactional fields (like expiration date, CVV):

```typescript
class SiblingField extends BaseField {
  // No WebSocket handling required
  // Relies on transactional field for processing
}
```

## Payment Processing Implementation

Based on the Card/ACH payment flow diagram, implement the payment processing sequence:

```typescript
// Payment processing in the WebSocket service
class WebSocketService {
  // ... other methods from above

  // Process payment transaction
  async processPayment(paymentData: any): Promise<any> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    try {
      // 1. Get challenge token
      const challengeToken = await this.getChallengeToken();
      
      // 2. Get payment parameters
      const paymentParams = await this.getPaymentParameters();
      
      // 3. Validate fields against parameters
      this.validateFields(paymentData, paymentParams);
      
      // 4. Format payment request
      const formattedRequest = this.formatPaymentRequest(paymentData, challengeToken);
      
      // 5. Send payment intent
      const paymentIntent = await this.sendSocketRequest('process_payment', formattedRequest);
      
      // 6. Return payment result to parent
      return paymentIntent;
    } catch (error) {
      // Handle and propagate errors
      console.error('[PT Debug] Payment processing error:', error);
      throw error;
    }
  }
  
  // Get challenge token for payment
  private async getChallengeToken(): Promise<string> {
    const response = await this.sendSocketRequest('get_challenge_token', {});
    
    if (!response.token) {
      throw new Error('Failed to get challenge token');
    }
    
    return response.token;
  }
  
  // Get payment parameters from the server
  private async getPaymentParameters(): Promise<any> {
    const response = await this.sendSocketRequest('get_payment_parameters', {});
    
    if (!response.parameters) {
      throw new Error('Failed to get payment parameters');
    }
    
    return response.parameters;
  }
  
  // Generic method to send socket requests and await responses
  private sendSocketRequest(action: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'));
      }
      
      const requestId = generateUniqueId();
      
      // Set up response handler
      const responseHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          
          if (response.requestId === requestId) {
            this.socket!.removeEventListener('message', responseHandler);
            
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        } catch (error) {
          console.error('[PT Debug] Error parsing socket response:', error);
        }
      };
      
      this.socket.addEventListener('message', responseHandler);
      
      // Send request
      this.socket.send(JSON.stringify({
        action,
        requestId,
        data
      }));
      
      // Set timeout
      setTimeout(() => {
        this.socket!.removeEventListener('message', responseHandler);
        reject(new Error(`Request ${action} timed out`));
      }, 30000);
    });
  }
}
```

## WebSocket Communication

The WebSocket service should handle secure communication with the backend:

```typescript
class WebSocketService {
  private socket: WebSocket | null = null;
  private messageQueue: any[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  // Connect to WebSocket service
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://secure.socket.paytheory.com/?pt_token=${token}`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('[PT Debug] WebSocket connection opened');
        this.sendQueuedMessages();
        resolve();
      };
      
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = (error) => {
        console.error('[PT Debug] WebSocket error:', error);
        reject(error);
      };
      
      this.socket.onmessage = this.handleMessage.bind(this);
    });
  }
  
  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data);
    
    // Handle different message types
    switch (data.type) {
      case 'host_token':
        this.handleHostToken(data);
        break;
      // Handle other message types
    }
  }
  
  // Send messages to the server
  send(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(message);
    }
  }
  
  // Send queued messages after connection
  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }
  
  // Handle connection close
  private handleClose(event: CloseEvent): void {
    console.log(`[PT Debug] WebSocket closed: ${event.code} ${event.reason}`);
    
    // Attempt reconnection if not a normal closure
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Implement exponential backoff
      setTimeout(() => {
        // Request new token and reconnect
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }
  
  // Send payment details
  sendPayment(paymentData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = generateUniqueId();
      
      // Set up one-time handler for this specific response
      const responseHandler = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.requestId === requestId) {
          this.socket?.removeEventListener('message', responseHandler);
          resolve(data);
        }
      };
      
      this.socket?.addEventListener('message', responseHandler);
      
      // Send the payment request
      this.send({
        action: 'process_payment',
        requestId,
        data: paymentData
      });
      
      // Set timeout for the request
      setTimeout(() => {
        this.socket?.removeEventListener('message', responseHandler);
        reject(new Error('Payment request timed out'));
      }, 30000);
    });
  }
}
```

## Token Management and Security

Implement secure token handling based on the flow diagrams:

```typescript
// Token management
class TokenManager {
  private hostToken: string | null = null;
  private sessionKey: string | null = null;
  
  // Store host token received from socket
  setHostToken(token: string, sessionKey: string): void {
    this.hostToken = token;
    this.sessionKey = sessionKey;
    console.log('[PT Debug] Host token received and stored');
  }
  
  // For transactional field to share token with siblings
  getSiblingTokenData(): { hostToken: string, sessionKey: string } | null {
    if (!this.hostToken || !this.sessionKey) {
      return null;
    }
    
    return {
      hostToken: this.hostToken,
      sessionKey: this.sessionKey
    };
  }
  
  // Verify if we have a valid token
  hasValidToken(): boolean {
    return !!this.hostToken;
  }
  
  // Clear tokens (e.g., on disconnect)
  clearTokens(): void {
    this.hostToken = null;
    this.sessionKey = null;
  }
}
```

## Field State Management

Ensure state objects are always complete:

```typescript
// Field state type definition
interface FieldState {
  valid: boolean;
  focus: boolean;
  empty: boolean;
  errorMessages: string[];
  isDirty: boolean;
}

// Create a state update function
function updateState(currentState: FieldState, updates: Partial<FieldState>): FieldState {
  // Start with a copy of the current state
  const newState = { ...currentState };
  
  // Apply updates
  Object.assign(newState, updates);
  
  // Ensure errorMessages is always an array
  newState.errorMessages = newState.errorMessages || [];
  
  return newState;
}
```

## Initialization and Token Ready

During initialization, each field should:

1. Send a token ready message when loaded
2. Wait for connection token
3. Establish connection (transactional field) or wait for connection confirmation
4. Send field state updates only after connected

```typescript
// In the entry point for each field
window.addEventListener('load', () => {
  // Get field type from URL or configuration
  const elementType = getElementType();
  
  // Initialize appropriate field
  let field;
  if (isTransactionalField(elementType)) {
    field = new TransactionalField(elementType);
  } else {
    field = new SiblingField(elementType);
  }
  
  // Send token ready message
  window.parent.postMessage({
    type: 'pt-static:pt_token_ready',
    element: elementType
  }, '*');
});
```

## Validation and Formatting

Implement robust validation and formatting:

```typescript
// Card number validation example
function validateCardNumber(value: string): string[] {
  const errors = [];
  
  // Remove spaces and non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Check length
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    errors.push('Card number must be between 13 and 19 digits');
  }
  
  // Luhn algorithm validation
  if (!passesLuhnCheck(digitsOnly)) {
    errors.push('Invalid card number');
  }
  
  return errors;
}

// Card number formatting
function formatCardNumber(value: string): string {
  // Remove non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Group digits in 4s
  const groups = [];
  for (let i = 0; i < digitsOnly.length; i += 4) {
    groups.push(digitsOnly.substring(i, i + 4));
  }
  
  return groups.join(' ');
}
```

## Error Handling

Implement robust error handling:

```typescript
function handleError(error: Error, element: string): void {
  console.error('[PT Debug] Error:', error);
  
  // Send error message to parent
  window.parent.postMessage({
    type: 'pt-static:error',
    element: element,
    error: error.message
  }, '*');
}
```

## Content Security Policy

Work within CSP restrictions:

```typescript
// Instead of inline styles (which will be blocked by CSP)
document.getElementById('card-field').setAttribute('style', 'color: red;');

// Use class names and external stylesheets
document.getElementById('card-field').className = 'error-field';
```

## Testing and Debugging

Include detailed logging for debugging:

```typescript
// Debug logging function
function debugLog(message: string, data?: any): void {
  console.log(`[PT Debug] ${message}`, data || '');
}

// Log all postMessage events
window.addEventListener('message', (event) => {
  debugLog(`Received message from ${event.origin}:`, event.data);
});
```

## Security Considerations

1. **Origin Validation**: Always validate message origins
2. **Content Sanitization**: Sanitize any dynamic content
3. **No Direct DOM Access**: Never directly access the parent DOM
4. **Sensitive Data Handling**: Never expose sensitive payment data in messages
5. **Input Validation**: Validate all user input rigorously
6. **Error Sanitization**: Don't expose sensitive details in error messages 