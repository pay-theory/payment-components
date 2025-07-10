// =============================================================================
// Messenger PostMessage Types (wallet transactions)
// =============================================================================

// Outgoing messages (Parent → Messenger)
export const PT_MESSENGER_ESTABLISH_CHANNEL = 'pt-messenger:establish_channel' as const;
export const PT_MESSENGER_MERCHANT_VALIDATION = 'pt-messenger:merchant_validation' as const;
export const PT_MESSENGER_WALLET_TRANSACTION = 'pt-messenger:wallet_transaction' as const;
export const PT_MESSENGER_RECONNECT_TOKEN = 'pt-messenger:reconnect_token' as const;
export const PT_MESSENGER_PING = 'pt-messenger:ping' as const;

export type OUTGOING_MESSENGER_TYPES =
  | typeof PT_MESSENGER_ESTABLISH_CHANNEL
  | typeof PT_MESSENGER_MERCHANT_VALIDATION
  | typeof PT_MESSENGER_WALLET_TRANSACTION
  | typeof PT_MESSENGER_RECONNECT_TOKEN
  | typeof PT_MESSENGER_PING;

// Incoming messages (Messenger → Parent)
export const PT_MESSENGER_CONNECTION_ACK = 'pt-messenger:connection_ack' as const;
export const PT_MESSENGER_SOCKET_CONNECTED = 'pt-messenger:socket_connected' as const;
export const PT_MESSENGER_SOCKET_ERROR = 'pt-messenger:socket_error' as const;
export const PT_MESSENGER_READY = 'pt-messenger:ready' as const;
export const PT_MESSENGER_APPLE_MERCHANT_VALIDATION =
  'pt-messenger:apple_merchant_validation' as const;
export const PT_MESSENGER_TRANSFER_COMPLETE = 'pt-messenger:transfer_complete' as const;
export const PT_MESSENGER_RECONNECT_TOKEN_SUCCESS = 'pt-messenger:reconnect_token_success' as const;

export type INCOMING_MESSENGER_TYPES =
  | typeof PT_MESSENGER_CONNECTION_ACK
  | typeof PT_MESSENGER_SOCKET_CONNECTED
  | typeof PT_MESSENGER_SOCKET_ERROR
  | typeof PT_MESSENGER_READY
  | typeof PT_MESSENGER_APPLE_MERCHANT_VALIDATION
  | typeof PT_MESSENGER_TRANSFER_COMPLETE
  | typeof PT_MESSENGER_RECONNECT_TOKEN_SUCCESS;
