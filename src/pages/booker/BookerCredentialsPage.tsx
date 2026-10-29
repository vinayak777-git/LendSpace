import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Plus,
  FileText,
  Calendar,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { credentialService } from '../../services/credentialService';
import { Credential } from '../../types';

export const BookerCredentialsPage: React.FC = () => {
  const { currentUser, showToast, refreshAll } = useAppStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('laser_cutting');
  const [certName, setCertName] = useState('Laser Cutter Safety & Practical Operation');
  const [docName, setDocName] = useState('laser_training_record.pdf');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const credentials: Credential[] = currentUser?.credentials || [
    {
      id: 'cred-1',
      type: '3d_printing',
      name: 'Rapid Prototyping & 3D Printing Lv1',
      status: 'verified',
      expiry: '2027-12-31T23:59:59.000Z',
      verifiedAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'cred-2',
      type: 'safety_level_1',
      name: 'General Lab & Machine Safety',
      status: 'verified',
      expiry: '2027-12-31T23:59:59.000Z',
      verifiedAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'cred-3',
      type: 'laser_cutting',
      name: 'Laser Cutter Safety & Operations',
      status: 'pending',
      expiry: '2027-12-31T23:59:59.000Z',
      docUrl: 'laser_training_form.pdf',
    },
  ];

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await credentialService.submitCredential(currentUser.id, selectedType, certName, docName);
      showToast('Credential document uploaded. Lab manager will review shortly.', 'success');
      await refreshAll();
      setIsUploadModalOpen(false);
    } catch {
      showToast('Upload failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const badgeCategories = [
    { type: 'laser_cutting', name: 'Laser Cutter Safety & Operations' },
    { type: 'wet_lab_cert', name: 'BSL-1 Chemical Hygiene & Biosafety' },
    { type: 'camera_handling', name: 'Cinema Media Equipment Handling' },
    { type: 'cnc_machining', name: 'CNC Milling & Toolpath Operations' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Badges &amp; Credentials
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Certified qualifications enable instant automated approvals across specialized equipment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 inline-flex items-center gap-1.5 self-start"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Credential</span>
        </button>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.map((cred) => (
          <div
            key={cred.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    cred.status === 'verified'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
                      : cred.status === 'pending'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    cred.status === 'verified'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                      : cred.status === 'pending'
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200'
                      : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200'
                  }`}
                >
                  {cred.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {cred.name}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {cred.type}
                </span>
              </div>

              {/* Rejection notice if any */}
              {cred.rejectedReason && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-0.5">
                  <strong className="font-bold block">Rejection Reason:</strong>
                  <p>{cred.rejectedReason}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expires: {new Date(cred.expiry).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
              </span>
              {cred.docUrl && <span className="font-mono text-[10px] text-teal-600 underline">View PDF</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <form
            onSubmit={handleUploadSubmit}
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Submit Credential Document
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Select Qualification Type</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  const found = badgeCategories.find((b) => b.type === e.target.value);
                  if (found) setCertName(found.name);
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {badgeCategories.map((b) => (
                  <option key={b.type} value={b.type}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Credential Title</label>
              <input
                type="text"
                required
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Certificate / Training PDF Filename</label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Submit for Verification</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
