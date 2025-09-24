# PayTheoryMessenger Test Outline

## 1. Constructor - Creation of PayTheoryMessenger Object

### Happy Path
- ✅ Creates new instance with valid API key
- ✅ Initializes with correct default values (sessionId, tokenManager, state)
- ✅ Registers instance in the static instances map

### Bad Path
- ❌ Returns existing instance when attempting to create duplicate with same API key
- ❌ Handles missing API key in options
- ❌ Handles invalid options object

## 2. Initialize Function

### Happy Path
- ✅ Successfully initializes when in IDLE state
- ✅ Creates iframe with correct attributes and URL
- ✅ Establishes communication channel
- ✅ Transitions state from IDLE → INITIALIZING → CONNECTED
- ✅ Emits READY event on successful initialization
- ✅ Returns success response with { success: true }

### Bad Path
- ❌ Rejects invalid API key format
- ❌ Prevents multiple simultaneous initializations
- ❌ Handles timeout waiting for iframe ready signal
- ❌ Properly transitions to ERROR state on failure

## 3. Process Wallet Transaction Function

### Happy Path
- ✅ Successfully processes transaction with all required fields
- ✅ Returns transaction response with SUCCESS type
- ✅ Emits TRANSACTION_COMPLETE event
- ✅ Maintains CONNECTED state after successful transaction
- ✅ Able to process even if initialize has not been called

### Bad Path
- ❌ Rejects missing required fields (amount, digitalWalletPayload, walletType)
- ❌ Handles channel not initialized error
- ❌ Handles connection failure before transaction
- ❌ Handles failed transaction status
- ❌ Emits TRANSACTION_COMPLETE event on failure

## 4. On Function (Event Subscription)

### Happy Path
- ✅ Successfully registers event listener for valid events
- ✅ Returns unsubscribe function
- ✅ Supports multiple listeners for same event
- ✅ Unsubscribe function removes correct listener

### Bad Path
- ❌ Handles invalid event name gracefully
- ❌ Returns no-op unsubscribe for invalid events
- ❌ Handles listener errors without affecting other listeners

## 5. Destroy Function

### Happy Path
- ✅ Removes all event listeners
- ✅ Removes iframe from DOM
- ✅ Resets state to IDLE

### Bad Path
- ❌ Handles destroy when already destroyed
- ❌ Handles destroy when iframe already removed
- ❌ Handles errors during cleanup gracefully
