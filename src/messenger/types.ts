// Basic response type
export interface MessengerResponse {
  success: boolean;
  error?: string;
}

// Apple Pay session response
export interface ApplePaySessionResponse extends MessengerResponse {
  session?: any;
}

// Transaction response
export interface TransactionResponse extends MessengerResponse {
  transaction_id?: string | null;
  status?: string;
  amount?: number;
  created?: string;
}

// Error response
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

// Wallet transaction payload
export interface WalletTransactionPayload {
  amount: number;
  digitalWalletPayload: any;
  walletType: string;
  payor?: any;
  reference?: string;
  accountCode?: string;
  metadata?: any;
  additionalPurchaseData?: any;
  billingAddress?: any;
  fee?: number;
  healthExpenseType?: string;
  invoiceId?: string;
  receiptDescription?: string;
  payorId?: string;
  recurringId?: string;
  sendReceipt?: boolean;
  split?: any;
}
