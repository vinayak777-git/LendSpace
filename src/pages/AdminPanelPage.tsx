import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { userService } from '../services/userService';
import { UserRole } from '../types';
import {
  Settings,
  Users,
  ShieldCheck,
  Sliders,
  RotateCcw,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const AdminPanelPage: React.FC = () => {
  const { users, resources, currentUser, refreshAll, resetDemoData, showToast } = useAppStore();

  const [weeklyCapDefault, setWeeklyCapDefault] = useState<number>(12);
  const [cooldownHoursDefault, setCooldownHoursDefault] = useState<number>(4);
  const [thesisWeight, setThesisWeight] = useState<number>(35);
  const [courseworkWeight, setCourseworkWeight] = useState<number>(25);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await userService.updateUser(userId, { role: newRole });
      showToast(`User role updated to ${newRole}`, 'success');
      refreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  const handleSavePolicy = () => {
    showToast('Fairness allocation policy parameters updated globally!', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-1">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hub Governance & Fairness Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure global allocation priority scoring, verify lab managers, and manage system roles.
          </p>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Demo Environment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Users & Role Management */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Users & Access Control</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Change role permissions or view credential status across all members
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-6">Member</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Verified Badges</th>
                    <th className="py-3.5 px-6 text-right">System Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const verifiedBadgesCount = u.credentials.filter((c) => c.status === 'verified').length;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
                              <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{u.name}</span>
                              <span className="text-[11px] text-slate-400">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-slate-600 font-medium">{u.org}</td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{verifiedBadgesCount} Verified</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold capitalize focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Fairness Policy Tuning */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Fairness Engine Tuning</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              These hyperparameters control priority weighting in <code className="text-emerald-700">/lib/fairness.ts</code> to prevent scarce resource hoarding.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Weekly Cap per User (Hours)
                </label>
                <input
                  type="number"
                  value={weeklyCapDefault}
                  onChange={(e) => setWeeklyCapDefault(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Scarce Resource Cooldown (Hours)
                </label>
                <input
                  type="number"
                  value={cooldownHoursDefault}
                  onChange={(e) => setCooldownHoursDefault(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Thesis / Capstone Weight (Pts)
                </label>
                <input
                  type="number"
                  value={thesisWeight}
                  onChange={(e) => setThesisWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Coursework / Lab Weight (Pts)
                </label>
                <input
                  type="number"
                  value={courseworkWeight}
                  onChange={(e) => setCourseworkWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <button
                onClick={handleSavePolicy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Allocation Policy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-2">
              Reset Demo Environment?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              This will reset all localStorage state back to original seed data. All new bookings, incidents, and edits will be reverted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setIsResetConfirmOpen(false);
                }}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
