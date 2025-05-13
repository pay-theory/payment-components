# Questions About Field Message Formats

## Background

During the implementation of the BaseField, TransactionalField, and SiblingField components, some questions arose about the standardization of message formats and handling across the system. These questions require clarification to ensure consistent implementation of the remaining tasks.

## Questions

### 1. Message Format Standardization

**Question:** Is there a complete list of all message types that need to be supported by the field components, and do we have a standard format for each?

**Context:** In the current implementation, we've used the message formatters for state updates, error messages, and connection messages. However, there may be other message types that need to be supported, and we need to ensure that all message types follow a consistent format.

**Relevance:** This impacts the implementation of the `messageFormatters.js` utility and ensures all components send properly structured messages.

**Answer:** Yes, there are standard formats for all message types. Based on the payment-components code, the formats are:

```typescript
// Field-to-Parent messages
{
  type: "pt-static:[message_type]",
  element: "card-number", // The field type identifier
  state?: {...},          // For state messages
  error?: "Error message" // For error messages
}

// Parent-to-Field messages
{
  type: "pay-theory:[message_type]",
  data: {...}             // Message-specific payload
}
```

All supported message types include:

- **Field to Parent**:
  - `pt-static:pt_token_ready` - Request connection token
  - `pt-static:state` - Update field state
  - `pt-static:connected` - Confirm connection established
  - `pt-static:error` - Report field error
  - `pt-static:relay` - Request message relay to another field
  - `pt-static:calculated_fee` - Fee calculation results
  - `pt-static:fee_calc_reconnect` - Fee calculator reconnection

- **Parent to Field**:
  - `pay-theory:state` - Broadcast global state to all fields
  - `pay-theory:valid` - Broadcast validation status
  - `pay-theory:ready` - Signal form readiness
  - `pt-static:connection_token` - Provide connection token
  - `pt-static:update-amount` - Update payment amount

### 2. Field-to-Field Communication

**Question:** Should field-to-field communication always go through the parent window, or can fields communicate directly in some cases?

**Context:** The current implementation routes all field-to-field communication through the parent window using relay messages. This follows the hub-and-spoke model, but it may introduce latency for high-frequency updates.

**Relevance:** This impacts the implementation of the `SiblingField` component and the field coordination mechanism.

**Answer:** Field-to-field communication should **always** go through the parent window. This is intentional for security reasons:

1. The parent-window acts as a security coordinator for cross-domain communication
2. It implements the hub-and-spoke model (transactional field is hub)
3. Direct field-to-field communication would break domain isolation

From the payment-components code, you can see this pattern implemented where the transactional field aggregates states and broadcasts them back:

```typescript
// Parent broadcasts aggregated state to all fields
window.postMessage({
  type: 'pay-theory:state',
  data: newState,
}, window.location.origin);
```

This design allows for field coordination while maintaining security boundaries. While this may introduce some latency, it's an intentional security trade-off.

### 3. Message Encryption

**Question:** Should sensitive field data in relay messages be encrypted, and if so, what encryption method should be used?

**Context:** The current implementation sends field state updates with actual field values in relay messages. This may expose sensitive data if the parent window is compromised.

**Relevance:** This impacts the implementation of the `sendStateToHub` method in the `SiblingField` component and the transaction data handling in the `TransactionalField` component.

**Answer:** **Sensitive field data should never be included in state or relay messages.**

The architecture is designed to keep sensitive data contained within each iframe. The correct implementation is:

1. **State messages**: Include validation status, focus state, etc. but NEVER the actual field values
2. **During transactions**: Actual field values should only be sent directly to the payment processor via the secure WebSocket connection, never to the parent window

State messages should contain only metadata like:
- Field validity status
- Focus state
- Empty/filled status
- Error messages (without revealing input values)
- Dirty state (whether user has interacted)

For PCI compliance, this isolation of sensitive data is critical, even within your own domains.

### 4. Field Registration Protocol

**Question:** What is the expected protocol for field registration with the parent window?

**Context:** The current implementation sends a connected message and a fields-ready message when a field is initialized. However, it's unclear if there should be a more formal registration process.

**Relevance:** This impacts the implementation of the field initialization in both the `TransactionalField` and `SiblingField` components.

**Answer:** The field registration protocol follows this sequence:

1. **Initialization**: Field loads and initializes
2. **Token Ready**: Field sends `pt-static:pt_token_ready` to parent
3. **Connection Token**: Parent responds with `pt-static:connection_token`
4. **WebSocket Connection**: Transactional field establishes WebSocket connection
5. **Connected**: Field sends `pt-static:connected` to parent
6. **Hub Ready**: Transactional field sends `pt-static:hub-ready` to indicate readiness to process sibling fields
7. **State Synchronization**: Fields begin sending state updates and receiving global state

For sibling fields, they should wait for the transactional field's "hub ready" message before sending their states. This ensures the hub-and-spoke model functions correctly.

Based on the payment-components implementation, this sequence is properly managed by the TransactionalField class.

### 5. Field Validation Integration

**Question:** How should field-specific validation rules be integrated with the base components?

**Context:** The current implementation allows for custom validators to be passed to the field components, but it doesn't specify how validation rules should be shared between fields or how cross-field validation should be implemented.

**Relevance:** This impacts the implementation of the validation mechanism in all field components.

**Answer:** Field validation should be implemented using a combination of:

1. **Field-specific validation**: Each field component implements its own validation logic
2. **Cross-field validation**: Using the global state to adapt validation based on other fields

The correct approach is:

```typescript
class SomeField extends BaseField {
  // Field-specific validation
  protected validateField(value: string): string[] {
    const errors = [];
    // Field-specific validation rules
    return errors;
  }
  
  // Cross-field validation using global state
  protected updateCrossFieldValidation(): void {
    // Access other fields' states from globalState
    const otherFieldState = this.globalState['other-field'];
    
    if (otherFieldState?.someProperty === someValue) {
      // Adjust validation rules based on other field's state
      this.applySpecialValidation = true;
    }
  }
}
```

For example, CVV validation should adapt based on the card type detected in the card number field:
- For Amex cards: Require 4 digits
- For other cards: Require 3 digits

This cross-field validation should be implemented by listening for global state updates and updating the field's validation rules accordingly.

## Next Steps

1. ✓ Seek clarification on these questions from the product team or technical leads
2. Update the implementation based on the clarifications
3. Create additional documentation as needed to ensure consistent implementation across the codebase 

## Additional Documentation Needed

Based on these clarifications, consider creating these additional documentation files:

1. **Message Protocol Reference**: Formal specification of all message types, their formats, and usage.
2. **Field Registration Sequence**: Detailed sequence diagram of the field registration process.
3. **Validation Guidelines**: Standards for implementing field-specific and cross-field validation.
4. **Security Boundaries**: Documentation of what data should never cross iframe boundaries.
5. **Testing Strategies**: Guidelines for testing field interactions and message handling. 