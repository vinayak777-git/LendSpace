import { apiClient } from './apiClient';

export interface LedgerEntry {
  id: string;
  wallet_id: string;
  booking_id?: string | null;
  type: 'topup' | 'hold' | 'payout' | 'refund' | 'adjustment';
  amount_minor_units: number;
  balance_after: number;
  idempotency_key: string;
  description: string;
  created_at: string;
}

export interface WalletData {
  wallet_id: string;
  user_id: string;
  currency: string;
  balance_minor_units: number;
  balance_display: string;
  ledger: LedgerEntry[];
}

export interface TopUpResponse {
  success: boolean;
  new_balance_minor: number;
  new_balance_display: string;
  credits_added: number;
}

export interface OwnerEarningsSummary {
  owner_id: string;
  currency: string;
  total_earned_minor: number;
  total_earned_display: string;
  escrow_held_minor: number;
  escrow_held_display: string;
  completed_reservations_count: number;
  recent_payouts: Array<{
    booking_id: string;
    resource_title: string;
    amount_minor: number;
    amount_display: string;
    date: string;
  }>;
}

export const walletService = {
  async getMyWallet(): Promise<WalletData> {
    return apiClient.get<WalletData>('/wallet/me');
  },

  async topUpCredits(amountCredits: number): Promise<TopUpResponse> {
    return apiClient.post<TopUpResponse>('/wallet/topup', {
      amount_credits: amountCredits,
      idempotency_key: `topup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
  },

  async getOwnerEarnings(): Promise<OwnerEarningsSummary> {
    return apiClient.get<OwnerEarningsSummary>('/wallet/owner/earnings');
  },
};

