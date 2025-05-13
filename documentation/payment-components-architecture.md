# Payment Components Architecture

## Overview

The PayTheory payment components system is a secure, iframe-based architecture designed for collecting sensitive payment information while maintaining PCI compliance. It consists of three main components:

1. **payment-components**: The main SDK library integrated by merchants
2. **secure-tags-lib**: The library powering the iframe content 
3. **tags-secure-socket**: The WebSocket service handling secure communication with payment processors

## System Architecture

```
┌─────────────────────────────────────────┐
│ Merchant Website                         │
│  ┌─────────────────────────────────────┐│
│  │ payment-components SDK               ││
│  │  ┌────────────┐    ┌────────────┐   ││
│  │  │ Main Field │    │ Sibling    │   ││
│  │  │ (iframe)   │    │ Fields     │   ││
│  │  │            │◄───┤ (iframes)  │   ││
│  │  └─────┬──────┘    └────────────┘   ││
│  └────────┼──────────────────────────────┘
└──────────┼──────────────────────────────┘
           │
           ▼
┌──────────────────────┐
│ Secure Socket Server │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Payment Processors    │
└──────────────────────┘
```

## Secure Socket Connection Flow

When a payment form is initialized, a secure connection flow is established:

1. **Session Key Creation**: The SDK creates a cryptographically secure random session key on page load, which is unique per SDK instance.
2. **Hosted Fields Mounting**: The SDK mounts the hosted iframe fields in the DOM.
3. **Token Ready Notification**: Each iframe sends a `pt_token_ready` message when loaded.
4. **PT Token Request**: The SDK sends the API Key and Session Key to the PT Token Authorizer.
5. **PT Token Generation**: The authorizer creates and returns an encoded token to the SDK.
6. **Token Distribution**: The SDK provides this token to the transactional field.
7. **WebSocket Connection**: The transactional field establishes a secure WebSocket connection using the token.
8. **Host Session Creation**: The transactional field requests a Host Token which creates a secure host session linked to the merchant ID and session key.
9. **Host Token Distribution**: The Host Token is received and stored by the transactional field.
10. **Sibling Token Creation**: For sibling fields, a similar process is followed to establish secure connections.

Key security features:
- Socket timeouts reuse the same session key to maintain secure continuity
- Host sessions use the key provided by the SDK payment components
- Session keys are tied to merchant ID and page session, ensuring only one secure session per SDK load

## Core Design Principles

1. **Security First**: Sensitive data never leaves the iframes, reducing PCI scope
2. **Hub-and-Spoke Model**: One central transactional field coordinates all operations
3. **Domain Isolation**: Hosted fields run in a separate domain from the merchant site
4. **Validation & Verification**: Client-side validation with server-side confirmation

## Component Roles

### 1. payment-components SDK

The merchant-facing SDK responsible for:

- Initializing and loading iframes
- Coordinating communication between iframes
- Exposing a developer-friendly API
- Managing token generation and validation
- Handling state synchronization
- Providing UI customization options

This component operates within the merchant's domain but never directly accesses sensitive payment data.

### 2. secure-tags-lib

The library running inside the iframes responsible for:

- Rendering secure input fields
- Validating user input
- Establishing secure connections to the backend
- Encrypting sensitive payment data
- Communicating state changes back to the parent SDK

This component operates within PayTheory's domain for enhanced security.

### 3. tags-secure-socket

The backend WebSocket service responsible for:

- Authentication and authorization
- Receiving encrypted payment details
- Communicating with payment processors
- Token generation and management
- Transaction processing
- Profile validation and permission enforcement
- Error handling and reporting

The service implements several key security checks:
- Validates PT Tokens for establishing connections
- Creates and manages host sessions
- Controls access to payment processing APIs
- Denies unauthorized access attempts
- Routes errors to the appropriate error handling mechanisms

## Component Hierarchy

```
payment-components                  # Main SDK package
├── src/
│   ├── components/                 # Web component definitions
│   │   ├── pay-theory-hosted-field/            # Base field class
│   │   ├── pay-theory-hosted-field-transactional/  # Transactional field
│   │   ├── credit-card/            # Field implementations
│   │   ├── credit-card-number/
│   │   └── ...
│   ├── field-set/                  # Higher-level field management
│   │   ├── payment-fields-v2.ts    # Modern implementation
│   │   ├── actions.ts              # Transaction actions
│   │   └── ...
│   ├── common/                     # Shared utilities
│   │   ├── message.ts              # Message handling
│   │   ├── network.ts              # Network operations
│   │   └── ...
│   ├── index.js                    # Main entry point
│   └── polyfill.js                 # Browser compatibility
└── ...
```

## Field Types

### Transactional Field
A special field type that manages the WebSocket connection to the server and coordinates with sibling fields. Each form has exactly one transactional field, typically the card number field for card payments.

### Sibling Fields
All other fields that collect various pieces of payment information but rely on the transactional field to communicate with the server.

## Initialization Sequence

1. Merchant initializes the payment-components SDK
2. SDK creates a session key and iframes for each field type
3. iframes load the secure-tags-lib
4. iframes notify the SDK they are ready for tokens
5. The SDK obtains a PT Token from the authorizer
6. The main transactional field establishes connection with the secure socket
7. The transactional field requests and receives a Host Token
8. Sibling fields coordinate with the main field
9. SDK signals when the form is ready for interaction

## Security Boundaries

- **Client Domain Isolation**: The payment-components SDK runs in the merchant domain, while secure-tags-lib runs in PayTheory's domain
- **Communication Restrictions**: All cross-domain communication uses structured, validated messages
- **Token Validation**: Each connection requires proper authentication and authorization
- **Data Encapsulation**: Sensitive data is encrypted before transmission
- **Session Isolation**: Unique session keys ensure payment sessions are isolated and secure

## Technology Stack

- **Frontend**: Custom Web Components, TypeScript, iframe communication
- **Communication**: postMessage API, WebSockets, JWT tokens
- **Security**: HTTPS, CSP (Content Security Policy), token-based authentication
- **Build Tools**: Webpack, Babel, TypeScript

## Design Considerations

- **Performance**: Minimizing layout shifts and input latency
- **Accessibility**: Ensuring all fields are accessible
- **Compatibility**: Supporting older browsers with polyfills
- **Error Handling**: Graceful failure modes and clear error reporting 