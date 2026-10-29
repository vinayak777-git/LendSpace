import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  User as UserIcon,
  ShieldCheck,
  ExternalLink,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { credentialService } from '../../services/credentialService';
import { Credential, User } from '../../types';

export const OwnerCredentialsReviewPage: React.FC = () => {
  const { users, refreshAll, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [pendingList, setPendingList] = useState<{ user: User; credential: Credential }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review modal state
  const [selectedItem, setSelectedItem] = useState<{ user: User; credential: Credential } | null>(null);
  const [reviewAction, setReviewAction] = useState<'verified' | 'expired'>('verified');
  const [reviewReason, setReviewReason] = useState('Verified institutional coursework completion and safety orientation attendance.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const items = await credentialService.getAllPendingCredentials();
      setPendingList(items);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [users]);

  const reasonTemplates = {
    verified: [
      'Verified institutional coursework completion and safety orientation attendance.',
      'Workshop attendance confirmed by lab supervisor.',
      'Prerequisite online training score of 100% confirmed in LMS records.',
    ],
    expired: [
      'Document unreadable, corrupted, or lacking faculty signature.',
      'Certificate expired past 1-year annual safety recertification window.',
      'Prerequisite safety practical assessment incomplete.',
    ],
  };

  const handleOpenReview = (item: { user: User; credential: Credential }, action: 'verified' | 'expired') => {
    setSelectedItem(item);
    setReviewAction(action);
    setReviewReason(reasonTemplates[action][0]);
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await credentialService.reviewCredential(
        selectedItem.user.id,
        selectedItem.credential.id,
        reviewAction,
        {
          id: authUser?.id || 'owner-1',
          name: authUser?.name || 'Owner',
          role: authUser?.role || 'owner',
        },
        reviewAction === 'expired' ? reviewReason : undefined
      );

      await refreshAll();
      await fetchPending();
      showToast(
        reviewAction === 'verified'
          ? `Badge "${selectedItem.credential.name}" successfully approved for ${selectedItem.user.name}.`
          : `Badge rejected with feedback: "${reviewReason}".`,
        reviewAction === 'verified' ? 'success' : 'info'
      );
      setSelectedItem(null);
    } catch {
      showToast('Failed to review credential.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900 mb-2">
          <Award className="w-3.5 h-3.5" />
          <span>Student Certification & Training Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Credentials Review Queue
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Review uploaded student safety certificates, test completions, and grant badge access for equipment reservations.
        </p>
      </div>

      {/* Pending Items List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading pending qualifications...</div>
      ) : pendingList.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            All Credentials Verified!
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            No pending training documents awaiting owner review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingList.map((item) => (
            <div
              key={item.credential.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.credential.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Applicant: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.user.name}</span> ({item.user.department || item.user.org || 'Student'})
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Category: {item.credential.type}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 uppercase">
                  Pending Review
                </span>
              </div>

              {/* Document Mock Preview */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium font-mono text-[11px]">
                    {item.credential.docUrl || 'training_certificate_verified.pdf'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">PDF • Signed</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenReview(item, 'expired')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenReview(item, 'verified')}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-colors"
                >
                  Approve Badge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                {reviewAction === 'verified' ? 'Approve Safety Badge' : 'Decline Qualification Document'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Student: <span className="font-bold text-slate-900 dark:text-white">{selectedItem.user.name}</span> ({selectedItem.user.email})
              </p>
              <p className="mt-0.5">
                Qualification: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedItem.credential.name}</span>
              </p>
            </div>

            {/* Quick Pick Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Quick-Pick Response Reason
              </label>
              <div className="space-y-1.5">
                {reasonTemplates[reviewAction].map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReviewReason(tmpl)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-colors border ${
                      reviewReason === tmpl
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Formal Feedback Note
              </label>
              <textarea
                rows={2}
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitReview}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md ${
                  reviewAction === 'verified'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {isSubmitting ? 'Saving...' : `Confirm ${reviewAction === 'verified' ? 'Approval' : 'Decline'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
