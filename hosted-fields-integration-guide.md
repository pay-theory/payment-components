# PayTheory Hosted Fields Integration Guide

## Current Status and Critical Issues

Based on the latest logs, we've identified several critical issues preventing the form fields from working properly:

1. **Non-Transactional Fields Not Being Initialized**: While the main `card-number` field initializes correctly, all other fields (`card-exp`, `card-cvv`, `card-name`, `billing-zip`) are rejected during token ready validation.

2. **State Update Errors**: All state updates trigger JavaScript errors:
   ```
   Uncaught TypeError: Cannot read properties of undefined (reading 'length')
   at set state (index.ts:380:49)
   ```

3. **Connected Messages Ignored**: The `pt-static:connected` messages from fields are being rejected, preventing proper synchronization.

## Root Causes

After analyzing the logs, we can see specific patterns that explain these issues:

1. **Token Ready Validation Mismatch**:
   ```
   [PT Debug] Received pt_token_ready event for element: card-number, matches: true
   [PT Debug] Received pt_token_ready event for element: card-exp, matches: false
   [PT Debug] Received pt_token_ready event for element: card-cvv, matches: false
   [PT Debug] Received pt_token_ready event for element: billing-zip, matches: false
   [PT Debug] Received pt_token_ready event for element: card-name, matches: false
   ```
   
   The SDK is validating differently for transactional vs. non-transactional fields.

2. **Missing Connected Message Handler**:
   ```
   [PT Debug] Received event from https://validate.tags.static.paytheorylab.com: {type: 'pt-static:connected', element: 'card-number'}
   [PT Debug] Message did not match valid target criteria
   ```

3. **State Handling Error**: The error indicates that the state handler is trying to access a property of an undefined object, likely because the fields aren't properly initialized.

## Required Fixes

### 1. Fix Token Ready Validation for Non-Transactional Fields

The SDK uses `this._transactingIFrameId.includes(event.element)` for validation, but this only works for the main transactional field. For non-transactional fields, you need to:

```javascript
// In the SDK's validation function (likely in message.ts or a related file)
const validateTokenReady = (message) => {
  // For transactional field
  if (message.type === 'pt-static:pt_token_ready' && 
      this._transactingIFrameId.includes(message.element)) {
    return true;
  }
  
  // For non-transactional fields - add this additional check
  if (message.type === 'pt-static:pt_token_ready' && 
      this._fieldTypes.includes(message.element)) {
    return true;
  }
  
  return false;
};
```

### 2. Add Connected Message Handler

You need to implement a handler for the `pt-static:connected` messages:

```javascript
// Add this to the message.ts file
export const connectedTypeMessage = (message) => 
  typeof message.type === 'string' && message.type === 'pt-static:connected';

// Then add a handler registration
this._removeConnectedListener = common.handleHostedFieldMessage(
  connectedTypeMessage,
  (message) => {
    // Handle the connected state for the specific field
    const field = message.element;
    this._connectedFields = this._connectedFields || {};
    this._connectedFields[field] = true;
    
    // Check if all required fields are connected
    this.checkAllFieldsConnected();
  }
);
```

### 3. Fix State Handling Error

The error occurs when trying to access a property of an undefined object. Add proper null checks:

```javascript
// In the state handler (index.ts around line 380)
set state(value: IncomingFieldState | undefined) {
  // Check that both value and value.element exist before proceeding
  if (!value || !value.element) return;
  
  // Check that stateGroup exists and has the property
  if (!(value.element in this._stateGroup)) {
    // Initialize it if needed
    this._stateGroup[value.element] = {
      errorMessages: [],
      isDirty: false
      // Other default properties
    };
  }
  
  // Now safely update the state
  this._stateGroup[value.element] = value;
  this.sendStateMessage();
  
  // Check for error messages safely with null checks
  const invalid = value.errorMessages && value.errorMessages.length > 0;
  // Rest of the function...
}
```

## Implementation Approach for Form Fields

Each field type needs a slightly different implementation approach:

### 1. Transactional Field (card-number)

The main card-number field is working correctly with token exchange and WebSocket connection. Make sure it also properly handles state synchronization with the sibling fields.

### 2. Non-Transactional Fields (card-exp, card-cvv, etc.)

These fields need to:

1. Send token ready messages with the correct element value that matches the field type expected by the SDK
2. Implement a connection token handler to establish their own connections
3. Send connected messages and wait for full initialization before handling input

```javascript
// Example for card-exp field
window.addEventListener('load', () => {
  const elementType = 'card-exp'; // Must match what's in the SDK's fieldTypes array
  
  // Send token ready
  window.parent.postMessage({
    type: 'pt-static:pt_token_ready',
    element: elementType
  }, '*');
  
  // Wait for connection token
  window.addEventListener('message', (event) => {
    if (isValidOrigin(event.origin)) {
      const message = event.data;
      
      if (message.type === 'pt-static:connection_token') {
        // Establish connection
        establishConnection(message.token);
        
        // Send connected message
        window.parent.postMessage({
          type: 'pt-static:connected',
          element: elementType
        }, '*');
        
        // Initialize UI and event handlers
        document.getElementById('field').disabled = false;
      }
    }
  });
});
```

## Testing Strategy

1. **Debug Token Ready Validation**: Add logging in the SDK's validation function to see why non-transactional fields are failing validation.

2. **Check Field Types Array**: Verify that the `_fieldTypes` array in the SDK contains all expected field types:
   ```javascript
   console.log('[PT Debug] fieldTypes array:', this._fieldTypes);
   ```

3. **Trace State Object Structure**: Log the complete state object before handling to see its structure:
   ```javascript
   console.log('[PT Debug] State object:', value);
   ```

4. **Test Fields Independently**: Initially test with just one non-transactional field to isolate issues.

## Immediate Next Steps

1. **Fix the SDK's Token Ready Validation**: This is the most critical issue preventing non-transactional fields from initializing.

2. **Implement Null Checks in State Handling**: Add defensive programming to prevent JavaScript errors.

3. **Add Connected Message Handler**: Enable proper field synchronization.

4. **Ensure Element Types Match**: Make sure the element types used in messages exactly match what the SDK expects in its fieldTypes array.

With these changes, you should be able to overcome the current issues and achieve proper field initialization and synchronization, allowing users to enter text in all fields.

## Need Additional Help?

If these changes don't resolve the issue, additional diagnostics would be helpful:

1. Add more detailed logging to show exactly what element types the SDK is expecting
2. Check if the SDK's validation logic has any special cases for different field types
3. Examine how the state object is structured in successful vs. failing cases 