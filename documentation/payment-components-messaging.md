# Payment Components Messaging Protocol

## Overview

The PayTheory payment components system uses a sophisticated messaging protocol to enable secure communication between different security domains while maintaining PCI compliance. This document details the message types, formats, and flow between the payment-components SDK and secure iframe content.

## Message Flow Architecture

```
┌───────────────────────┐     ┌───────────────────────┐
│  Merchant Domain       │     │  PayTheory Domain     │
│                        │     │                       │
│  ┌─────────────────┐   │     │   ┌─────────────────┐ │
│  │     SDK         │   │     │   │  Transactional  │ │
│  │                 │◄──┼─────┼───┤  Field Iframe   │ │
│  └───┬─────────────┘   │     │   └─────┬───────────┘ │
│      │                 │     │         │             │
│      │                 │     │         │             │
│      │                 │     │         ▼             │
│      │                 │     │   ┌─────────────────┐ │
│      │                 │     │   │  Sibling Field  │ │
│      └────────────────┼─────┼───►     Iframes     │ │
│                        │     │   └─────────────────┘ │
└───────────────────────┘     └───────────────────────┘
```

## Cross-Domain Communication

All communication between domains occurs via the `postMessage` API:

1. **Parent-to-Iframe**: SDK to iframe messages
2. **Iframe-to-Parent**: Iframe to SDK messages
3. **Iframe-to-Iframe**: Communication between sibling iframes (coordinated through parent)

## Message Types

### 1. Initialization Messages

#### Token Ready
Sent from iframe to parent to indicate readiness to receive connection token.

```javascript
{
  type: "pt-static:pt_token_ready",
  element: "card-number" // Element type identifying the sender
}
```

#### Connection Token
Sent from parent to iframe with authentication token to establish secure connection.

```javascript
{
  type: "pt-static:connection_token",
  data: {
    token: "jwt_token_string",
    // Other connection parameters
  },
  async: true // Uses MessageChannel for response
}
```

#### Connected
Sent from iframe to parent after WebSocket connection is established.

```javascript
{
  type: "pt-static:connected",
  element: "card-number" // Element type identifying the sender
}
```

### 2. State Update Messages

#### Field State
Sent from iframe to parent when field state changes.

```javascript
{
  type: "pt-static:state",
  element: "card-number", // Element type identifying the sender
  state: {
    valid: boolean,       // Whether the field is valid
    focus: boolean,       // Whether the field has focus
    empty: boolean,       // Whether the field is empty
    errorMessages: [],    // Array of error messages (never undefined)
    isDirty: boolean      // Whether the field has been interacted with
  }
}
```

#### Relay Messages
Used to relay information between iframes via the parent.

```javascript
{
  type: "pt-static:relay",
  source: "card-number",  // Source element type
  target: "card-exp",     // Target element type
  data: {                 // Payload data
    // Varies based on message purpose
  }
}
```

### 3. Transaction Messages

#### Payment Detail
Used to initiate a payment transaction.

```javascript
{
  type: "pt-static:payment-detail",
  data: {
    amount: number,
    payorInfo: {
      // Customer information
    },
    // Other transaction details
  },
  async: true
}
```

#### Confirmation
Used to capture a pre-authorized transaction.

```javascript
{
  type: "pt-static:confirm",
  async: true
}
```

#### Cancel
Used to cancel a pending transaction.

```javascript
{
  type: "pt-static:cancel"
}
```

### 4. Error Messages

Sent from iframe to parent when an error occurs.

```javascript
{
  type: "pt-static:error",
  error: "Error message text",
  element: "card-number" // Element type identifying the source
}
```

## Transaction Processing Flow

When processing a payment transaction, the following sequence occurs:

1. **Transaction Initiation**: The SDK sends a payment detail message to the transactional field
2. **Field Validation**: The system checks if all required fields are valid
3. **Challenge Token**: If valid, the socket service obtains a challenge token for verification
4. **Payment Parameters**: The system fetches and validates payment parameters
5. **Payment Processing**:
   - The payment details are collected from all relevant fields
   - The system initiates payment processing through the Payment Intent Service
   - The transaction undergoes validation including checking for fraud
   - The system retrieves merchant identity and fee calculation
   - The payment is finalized and a transaction number is created

6. **Completion Flow**:
   - On successful completion, a token and confirmation message are sent
   - The SDK notifies the merchant application of the completed transaction
   - Transaction history is updated in the database

7. **Error Handling**:
   - If errors occur at any step, appropriate error messages are returned
   - The SDK notifies the merchant application of the failure
   - Error details are logged for troubleshooting

8. **Payment Confirmation or Cancellation**:
   - The merchant can send confirmation to capture the payment
   - Alternatively, the merchant can cancel the payment
   - Both actions update the payment status in the system and database

## Message Validation

All messages undergo strict validation:

1. **Origin Validation**: Messages are only accepted from trusted domains
2. **Type Validation**: Message types must match expected formats
3. **Element Validation**: Element identifiers must be recognized
4. **Content Validation**: Message content must match expected schema

## Hub-and-Spoke Communication Model

The system uses a hub-and-spoke communication model:

1. **Transactional Field (Hub)**:
   - Establishes primary WebSocket connection
   - Coordinates with sibling fields
   - Processes transaction requests

2. **Sibling Fields (Spokes)**:
   - Send state updates to parent
   - Receive validation and formatting instructions
   - Communicate with hub through the parent

## Message Sequence Diagrams

### Initialization Sequence

```
┌─────────┐           ┌────────────┐         ┌──────────────┐
│   SDK   │           │ Trans Field │         │ Sibling Field │
└────┬────┘           └─────┬──────┘         └──────┬───────┘
     │     Create iframe     │                       │
     │─────────────────────►│                        │
     │     Create iframe     │                        │
     │────────────────────────────────────────────────►
     │                       │                        │
     │  pt-static:pt_token_ready                      │
     │◄──────────────────────┤                        │
     │                       │                        │
     │ pt-static:connection_token                     │
     │─────────────────────►│                        │
     │                       │  WebSocket Connection  │
     │                       │◄───────────────────────┤
     │                       │                        │
     │    pt-static:connected                        │
     │◄──────────────────────┤                        │
     │                       │                        │
     │                       │                        │
```

### State Update Sequence

```
┌─────────┐           ┌────────────┐         ┌──────────────┐
│   SDK   │           │ Trans Field │         │ Sibling Field │
└────┬────┘           └─────┬──────┘         └──────┬───────┘
     │                       │                       │
     │                       │                       │ User input
     │                       │                       │◄─────────
     │                       │                       │
     │      pt-static:state                         │
     │◄───────────────────────────────────────────────
     │                       │                       │
     │ Handle state update   │                       │
     │◄─────────────┐        │                       │
     │              │        │                       │
     │              │        │                       │
     │◄─────────────┘        │                       │
     │                       │                       │
```

### Transaction Sequence

```
┌─────────┐           ┌────────────┐         ┌──────────────┐
│   SDK   │           │ Trans Field │         │ Sibling Field │
└────┬────┘           └─────┬──────┘         └──────┬───────┘
     │                       │                       │
     │ pt-static:payment-detail                     │
     │─────────────────────►│                       │
     │                       │                       │
     │                       │ Request field data    │
     │                       │──────────────────────►│
     │                       │                       │
     │                       │ Send field data       │
     │                       │◄──────────────────────┤
     │                       │                       │
     │                       │ Process payment       │
     │                       │◄───────────┐          │
     │                       │            │          │
     │                       │            │          │
     │                       │◄───────────┘          │
     │                       │                       │
     │  Transaction result   │                       │
     │◄──────────────────────┤                       │
     │                       │                       │
```

### Payment Confirmation Sequence

```
┌─────────┐           ┌────────────┐         ┌───────────────┐         ┌─────────────┐
│   SDK   │           │ Trans Field │         │ Socket Service │         │ Payment DB  │
└────┬────┘           └─────┬──────┘         └───────┬───────┘         └──────┬──────┘
     │                       │                        │                        │
     │ pt-static:confirm     │                        │                        │
     │─────────────────────►│                        │                        │
     │                       │                        │                        │
     │                       │ Confirmation request   │                        │
     │                       │────────────────────────►                        │
     │                       │                        │                        │
     │                       │                        │  Update payment status │
     │                       │                        │────────────────────────►
     │                       │                        │                        │
     │                       │    Confirmation result │                        │
     │                       │◄────────────────────────                        │
     │                       │                        │                        │
     │  Confirmation result  │                        │                        │
     │◄──────────────────────┤                        │                        │
     │                       │                        │                        │
     │ Send confirmation     │                        │                        │
     │ to merchant app       │                        │                        │
     │◄─────────────┐        │                        │                        │
     │              │        │                        │                        │
     │              │        │                        │                        │
     │◄─────────────┘        │                        │                        │
     │                       │                        │                        │
```

## Implementation Requirements

### SDK (payment-components)

1. **Message Handling**:
   - Register postMessage event listeners
   - Validate incoming messages
   - Route messages to appropriate handlers

2. **Token Management**:
   - Generate session identifiers
   - Request backend tokens
   - Distribute tokens to iframes

3. **State Coordination**:
   - Aggregate state from multiple fields
   - Notify merchant application of state changes

### Iframe Content (secure-tags-lib)

1. **Message Handling**:
   - Send correctly formatted messages
   - Respond to parent messages
   - Validate message origins

2. **State Management**:
   - Track input field state
   - Send complete state objects (no undefined properties)
   - Maintain proper validation state

3. **Security Considerations**:
   - Never expose sensitive data to parent
   - Validate all incoming messages
   - Follow Content Security Policy restrictions 