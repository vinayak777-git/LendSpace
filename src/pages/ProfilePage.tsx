import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { userService } from '../services/userService';
import { Credential } from '../types';
import {
  User as UserIcon,
  ShieldCheck,
  Award,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Eye,
  FileText,
  Info,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, users, refreshAll, showToast } = useAppStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newBadgeType, setNewBadgeType] = useState('3d_printing');
  const [newBadgeName, setNewBadgeName] = useState('Rapid Prototyping & 3D Printing Lv1');
  const [mockFileName, setMockFileName] = useState('training_certificate_verified.pdf');

  // Manager verify dialog
  const [selectedCredForAction, setSelectedCredForAction] = useState<{
    userId: string;
    cred: Credential;
    action: 'verify' | 'reject';
  } | null>(null);
  const [actionReason, setActionReason] = useState('Practical slicer test and safety checklist completed.');

  const isStaff = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  const badgeTemplates = [
    { type: '3d_printing', name: 'Rapid Prototyping & 3D Printing Lv1' },
    { type: 'laser_cutting', name: 'Laser Safety & Optics Certification' },
    { type: 'safety_level_1', name: 'Level 1 General Safety Badge' },
    { type: 'wet_lab_cert', name: 'BSL-1 Bio-Safety Laboratory Orientation' },
  ];

  const handleUploadCredential = async () => {
    if (!currentUser) return;
    try {
      await userService.uploadCredential(currentUser.id, {
        type: newBadgeType,
        name: newBadgeName,
        docUrl: mockFileName,
      });
      showToast(`Submitted "${newBadgeName}" for manager verification.`, 'success');
      setIsUploadModalOpen(false);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    }
  };

  const handleManagerCredentialDecision = async () => {
    if (!selectedCredForAction || !currentUser) return;
    try {
      if (selectedCredForAction.action === 'verify') {
        await userService.verifyCredential(
          selectedCredForAction.userId,
          selectedCredForAction.cred.id,
          currentUser,
          actionReason
        );
        showToast(`Credential verified for student!`, 'success');
      } else {
        await userService.rejectCredential(
          selectedCredForAction.userId,
          selectedCredForAction.cred.id,
          currentUser,
          actionReason
        );
        showToast('Credential rejected with explanation.', 'info');
      }
      setSelectedCredForAction(null);
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Overview Card */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-emerald-500/30 shrink-0">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {currentUser?.name}
                </h1>
                {currentUser?.verified && (
                  <span className="p-1 rounded-full bg-emerald-100 text-emerald-700" title="Verified Campus Member">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentUser?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize border border-slate-200">
                  {currentUser?.role}
                </span>
                <span className="text-xs text-slate-600 font-medium">{currentUser?.org}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Training Certificate</span>
          </button>
        </div>

        {/* Usage statistics bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Hours Used This Week
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {currentUser?.usageStats?.hoursThisWeek || 0} Hours
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Sessions
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {currentUser?.usageStats?.activeBookingsCount || 0} Active
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Completed Bookings
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {currentUser?.usageStats?.completedBookingsCount || 0} Completed
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Late Returns Flagged
            </span>
            <span
              className={`text-lg font-extrabold ${
                (currentUser?.usageStats?.lateReturnsCount || 0) > 0
                  ? 'text-rose-600'
                  : 'text-emerald-600'
              }`}
            >
              {currentUser?.usageStats?.lateReturnsCount || 0} Late
            </span>
          </div>
        </div>
      </div>

      {/* Badges & Prerequisite Credentials */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>Training Badges & Equipment Certifications</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prerequisite safety badges unlock automatic reservations on 3D printers, laser cutters, and wet labs.
            </p>
          </div>
        </div>

        {currentUser?.credentials && currentUser.credentials.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300">
            <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 mb-3">No certificates or badges on file yet.</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
            >
              Submit First Training Certificate
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUser?.credentials.map((cred) => {
              const isVerified = cred.status === 'verified';
              const isPending = cred.status === 'pending';
              const isExpired = cred.status === 'expired';

              return (
                <div
                  key={cred.id}
                  className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                    isVerified
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : isPending
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">{cred.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {cred.status}
                      </span>
                    </div>

                    <p className="text-slate-500 text-[11px] mb-2">
                      Badge Code: <code className="text-slate-700">{cred.type}</code>
                    </p>

                    {isVerified && (
                      <div className="flex items-center gap-1.5 text-emerald-700 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid through {new Date(cred.expiry).toLocaleDateString()}</span>
                      </div>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-1.5 text-amber-800 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Submitted • Awaiting lab technician review</span>
                      </div>
                    )}

                    {isExpired && cred.rejectedReason && (
                      <div className="text-rose-700 text-[11px] mt-1">
                        <strong>Reason:</strong> {cred.rejectedReason}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Doc: {cred.docUrl || 'verified_doc.pdf'}</span>
                    {isPending && isStaff && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() =>
                            setSelectedCredForAction({
                              userId: currentUser.id,
                              cred,
                              action: 'verify',
                            })
                          }
                          className="px-2 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() =>
                            setSelectedCredForAction({
                              userId: currentUser.id,
                              cred,
                              action: 'reject',
                            })
                          }
                          className="px-2 py-1 rounded bg-rose-600 text-white font-bold hover:bg-rose-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Privacy Notice & What We Collect */}
      <div className="rounded-3xl bg-slate-900 text-slate-300 p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
          <div className="space-y-3 text-xs leading-relaxed">
            <h3 className="font-bold text-white text-base">
              Transparent Data & Privacy Notice
            </h3>
            <p className="text-slate-400">
              LendSpace operates under a zero-telemetry, privacy-preserving browser architecture. Here is exactly what data is stored and why:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-white block mb-1">1. Academic Profiles</span>
                <span className="text-[11px] text-slate-400">
                  Name, department, and role to verify university affiliation and enforce fair student quotas.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-white block mb-1">2. Prerequisite Badges</span>
                <span className="text-[11px] text-slate-400">
                  Machine safety and laser optics credentials required by university environmental safety regulations.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-white block mb-1">3. Condition Proofs</span>
                <span className="text-[11px] text-slate-400">
                  Before and after photos stored locally to protect students from unfair blame for pre-existing wear.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Certificate Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Upload Prerequisite Credential</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Certification Module
                </label>
                <div className="space-y-1.5">
                  {badgeTemplates.map((tmpl) => (
                    <button
                      key={tmpl.type}
                      type="button"
                      onClick={() => {
                        setNewBadgeType(tmpl.type);
                        setNewBadgeName(tmpl.name);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                        newBadgeType === tmpl.type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mock Document Filename
                </label>
                <input
                  type="text"
                  value={mockFileName}
                  onChange={(e) => setMockFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadCredential}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm"
              >
                Submit Credential
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Decision Modal */}
      {selectedCredForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base capitalize">
                {selectedCredForAction.action} Credential
              </h3>
              <button
                onClick={() => setSelectedCredForAction(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Please provide a verification audit note for credential "
                <strong>{selectedCredForAction.cred.name}</strong>".
              </p>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff Review Note
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedCredForAction(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleManagerCredentialDecision}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-emerald-600 shadow-sm capitalize"
              >
                Confirm {selectedCredForAction.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
