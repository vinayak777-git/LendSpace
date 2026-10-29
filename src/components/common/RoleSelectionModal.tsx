import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  Building,
} from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelectLooker = () => {
    onClose();
    navigate('/app');
  };

  const handleSelectOwner = () => {
    onClose();
    navigate('/owner');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Choose Your Portal</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Are you a Booker or an Owner?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select the workspace you want to enter.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Main Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LOOKER OPTION */}
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-5 flex flex-col justify-between hover:border-emerald-500 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                Booker Portal
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Discover equipment, book makerspaces, manage safety badges, and handle check-in / check-out.
              </p>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Search 3D printers, laser cutters, &amp; labs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Instant reservation &amp; check-in flow</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSelectLooker}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <span>Enter Booker Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* OWNER OPTION */}
          <div className="rounded-2xl border-2 border-teal-500/30 bg-teal-50/20 dark:bg-teal-950/20 p-5 flex flex-col justify-between hover:border-teal-500 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                Owner Portal
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Manage listings, approve reservation requests, review incident reports, and oversee safety.
              </p>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Inspect damage logs &amp; incident tickets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Manage equipment rules &amp; listings</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSelectOwner}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <span>Enter Owner Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
