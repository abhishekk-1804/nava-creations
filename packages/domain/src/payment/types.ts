export type PaymentMethod =
  | 'UPI_MERCHANT_QR'
  | 'COD'
  | 'NET_BANKING_DIRECT';

export type PaymentStatus =
  | 'INITIATED'
  | 'AWAITING_VERIFICATION'
  | 'VERIFIED'
  | 'PENDING_COLLECTION'
  | 'COLLECTED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'FAILED'
  | 'REJECTED';

/**
 * Customer-Facing Payment States (Truthful, non-misleading transaction progression)
 */
export type CustomerPaymentStatus =
  | 'AWAITING_PAYMENT'           // Step 1: QR / Intent generated; customer needs to pay
  | 'REFERENCE_SUBMITTED'        // Step 2: Customer submitted UTR
  | 'PAYMENT_UNDER_VERIFICATION' // Step 3: Admin matching reference against bank ledger
  | 'VERIFIED'                   // Step 4: Confirmed received in atelier current account
  | 'REJECTED'                   // Step 4b: Invalid reference or credit not found
  | 'EXPIRED'                    // Step 4c: Verification window elapsed
  | 'PARTIALLY_REFUNDED'         // Step 5a: Partial refund processed
  | 'REFUNDED';                  // Step 5b: Full refund settled

export interface PaymentStateTransition {
  readonly from: PaymentStatus;
  readonly to: PaymentStatus;
  readonly reason?: string;
  readonly performedByUserId?: string;
  readonly timestamp: Date;
}

export interface UpiVerificationInput {
  readonly orderNumber: string;
  readonly claimedUtr?: string;            // Customer-claimed UTR reference (optional if admin matches directly)
  readonly verifiedTransactionId: string;  // Authoritative bank ledger reference confirmed by admin
  readonly amountPaise: number;
  readonly verifiedByUserId: string;       // Admin performing the verification audit
  readonly beneficiaryAccount?: string;    // Confirmed beneficiary account
  readonly bankReference?: string;
  readonly verificationNotes?: string;
}

export interface UpiVerificationResult {
  readonly success: boolean;
  readonly verifiedAt: Date;
  readonly verifiedByUserId: string;
  readonly orderNumber: string;
  readonly claimedUtr: string;
  readonly verifiedTransactionId: string;
  readonly error?: string;
}

export interface CodCollectionRecord {
  readonly orderNumber: string;
  readonly amountPaise: number;
  readonly collectedBy: string;
  readonly collectedAt: Date;
  readonly courierAwb?: string;
  readonly settlementBatchId?: string;
}
