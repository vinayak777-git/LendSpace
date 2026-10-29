import React, { useState, useEffect } from 'react';
import { walletService, WalletData, OwnerEarningsSummary } from '../../services/walletService';
import { useAuthStore } from '../../store/useAuthStore';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { currentUser: user } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [ownerEarnings, setOwnerEarnings] = useState<OwnerEarningsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(100);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isOwner = user?.role === 'owner' || user?.role === 'manager';

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const data = await walletService.getMyWallet();
      setWallet(data);

      if (isOwner) {
        try {
          const earnings = await walletService.getOwnerEarnings();
          setOwnerEarnings(earnings);
        } catch {
          // ignore if non-owner
        }
      }
    } catch (err: any) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWallet();
      setMessage(null);
    }
  }, [isOpen]);

  const handleTopUp = async (amount: number) => {
    try {
      setIsToppingUp(true);
      setMessage(null);
      const res = await walletService.topUpCredits(amount);
      setMessage({
        text: `Successfully added ${res.credits_added} credits! New balance: ${res.new_balance_display}`,
        type: 'success',
      });
      await fetchWallet();
    } catch (err: any) {
      setMessage({
        text: err?.message || 'Top-up failed. Please try again.',
        type: 'error',
      });
    } finally {
      setIsToppingUp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xl">
              ₹
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Platform Credits & Escrow Ledger</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Local & Built-In • Zero Payment Gateways Required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {message && (
            <div
              className={`p-3 rounded-xl text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20">
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                My Available Credits
              </span>
              <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {wallet?.balance_display || '₹0.00'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Used for instant security deposit holds and resource reservations.
              </p>
            </div>

            {isOwner && ownerEarnings && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Owner Total Earned
                </span>
                <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                  {ownerEarnings.total_earned_display}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                  <span>In Escrow Hold: {ownerEarnings.escrow_held_display}</span>
                  <span>{ownerEarnings.completed_reservations_count} Completed</span>
                </div>
              </div>
            )}
          </div>

          {/* Top-up Form */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
              Quick Top-Up Platform Credits
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {[50, 100, 250, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpAmount(amt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    topUpAmount === amt
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-teal-400'
                  }`}
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min="50"
                max="50000"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Math.max(50, parseInt(e.target.value) || 50))}
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Credits amount"
              />
              <button
                type="button"
                disabled={isToppingUp}
                onClick={() => handleTopUp(topUpAmount)}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {isToppingUp ? 'Adding...' : 'Top Up Now'}
              </button>
            </div>
          </div>

          {/* Append-Only Ledger Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Append-Only Financial Ledger History
              </h3>
              <span className="text-xs text-slate-500">
                {wallet?.ledger?.length || 0} recorded transactions
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date / Time</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {(!wallet?.ledger || wallet.ledger.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No financial transactions yet. Top up credits above to get started.
                      </td>
                    </tr>
                  ) : (
                    wallet.ledger.map((entry) => {
                      const isPositive = entry.amount_minor_units > 0;
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(entry.created_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                entry.type === 'topup'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : entry.type === 'hold'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : entry.type === 'payout'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 truncate max-w-[200px]" title={entry.description}>
                            {entry.description}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-semibold ${
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {isPositive ? '+' : ''}₹{(entry.amount_minor_units / 100).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-500">
                            ₹{(entry.balance_after / 100).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
