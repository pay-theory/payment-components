# PayTheory Hosted Fields Communication Protocol

## Token Ready Message

### Expected Message Type and Format

The SDK expects a message with the following characteristics:

- **Type**: `"pt-static:pt_token_ready"`
- **Format**: An object that includes:
  - `type`: The string "pt-static:pt_token_ready"
  - `element`: The element type that matches the transacting iframe ID

### Sample of Correctly Formatted Message

A correctly formatted message would look like:

```javascript
{
  type: "pt-static:pt_token_ready",
  element: "credit-card" // or another relevant element type that matches the iframe
}
```

The validation function checks if:
1. The `type` property equals `"pt-static:pt_token_ready"`
2. The `element` property is included in the transacting iframe ID:
```javascript
const matches =
  event.type === 'pt-static:pt_token_ready' &&
  this._transactingIFrameId.includes(event.element);
```

### Timing Requirements

There is a specific sequence for the communication:

1. The iframe component gets initialized and mounted to the DOM
2. The SDK sets up a listener with `_removeHostTokenListener` during the `connectedCallback` lifecycle method
3. The iframe should send the "pt_token_ready" message when it's ready to receive the connection token
4. The SDK then responds by calling `sendPtToken()` which sends a "pt-static:connection_token" message to the iframe
5. The iframe should then process this token and establish the secure connection

The timing requirement is that this message should only be sent after the iframe is fully loaded and initialized, but before any other transaction-related messages.

## Complete Connection Flow

Based on the secure socket connection diagram, the complete connection process works as follows:

1. **SDK Initialization**: 
   - The merchant initializes a payment session
   - The SDK creates a cryptographically secure random session key
   - This session key is unique per page load, ensuring only one session per SDK instance

2. **Iframe Initialization**:
   - The SDK creates and mounts the transactional field iframe
   - The iframe loads and sends the token ready message (pt-static:pt_token_ready)

3. **Token Creation**:
   - The SDK sends the API key and session key to the PT Token Authorizer
   - The authorizer creates a PT token and returns it to the SDK
   - The SDK sends this token to the iframe via "pt-static:connection_token" message

4. **WebSocket Connection**:
   - The transactional field uses the token to establish a WebSocket connection
   - It then requests a Host Token from the socket service
   - If valid, the Host Session is collected and a connection to the Location Service is established

5. **Profile Validation**:
   - The system validates if the profile is allowed
   - If valid, a 200 response is sent back indicating successful connection
   - If invalid, access is denied and errors are sent to the error queue

6. **Ready State**:
   - Once connected, the field sends a "pt-static:connected" message to the SDK
   - The SDK then updates its internal state to reflect the ready connection

7. **Sibling Fields**:
   - Similar process occurs for sibling fields, but they communicate through the transactional field
   - The transactional field acts as the coordination point for all payment-related operations

### Additional Required Properties

For this specific notification, the message must include:
- `type`: "pt-static:pt_token_ready"
- `element`: Must match one of the element types that are included in the transacting iframe ID

No other properties appear to be required for this message, but the `element` property is critical as it's used in validation.

## Field Validation Process

When fields are being validated for payment processing:

1. **Individual Field Validation**:
   - Each field performs client-side validation on user input
   - Validation results are sent to the SDK through "pt-static:state" messages

2. **Collective Validation**:
   - During transaction processing, all required fields must be valid
   - The transactional field coordinates validation across all sibling fields
   - If any required field is invalid, the transaction cannot proceed

3. **Server-Side Validation**:
   - After client-side validation passes, data is sent to the server
   - The server performs additional validation including format checking
   - Any server validation failures result in error messages returned to the client

## All Accepted Message Types

Based on the message handlers defined in the code, here are the message types that the validTarget functions are configured to accept from hosted fields:

| Message Type | Description |
|--------------|-------------|
| `pt-static:pt_token_ready` | Token ready notification |
| `pt-static:state` | State updates |
| `pt-static:relay` | Message relay |
| `pt-static:calculated_fee` | Fee calculation results |
| `pt-static:fee_calc_reconnect` | Fee calculator reconnection |
| `pt-static:error` | Error messages |
| `pt-static:card-present` | Card-present device information |
| `pt-static:button-click` | Button click events |
| `pt-static:button-ready` | Button ready notification |
| `pt-static:qr-ready` | QR code ready |
| `pt-static:qr-checkout-success` | QR checkout success |
| `pt-static:connected` | Connection established notification |

## Common Issues

If you see the error message `"[PT Debug] Message did not match valid target criteria"`, the issue is likely one of the following:

1. The message from the iframe doesn't have the right `type` value
2. The `element` property doesn't match what the SDK expects
3. The message is arriving before the listener is set up or after it's removed
4. The session key has not been properly established or has expired
5. The secure connection to the socket service has failed to initialize

## Debugging Tips

1. Add more detailed logging before the validation check:
```javascript
console.log(`[PT Debug] Validating message:`, message);
console.log(`[PT Debug] Expected element to match:`, this._transactingIFrameId);
```

2. Ensure the iframe is fully loaded before sending messages:
```javascript
// In iframe content
window.addEventListener('load', () => {
  // Wait a moment to ensure parent is ready
  setTimeout(() => {
    window.parent.postMessage({
      type: 'pt-static:pt_token_ready',
      element: 'credit-card' // Use appropriate element
    }, '*');
  }, 100);
});
```

3. Check that the message origin is correctly set and allowed 

4. Verify WebSocket connection status:
```javascript
// In iframe content
console.log(`[PT Debug] WebSocket state:`, socket.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

5. Validate session key creation:
```javascript
// In SDK
console.log(`[PT Debug] Session key created:`, !!sessionKey);
```