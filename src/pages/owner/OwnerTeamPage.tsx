import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Check,
  X,
  Trash2,
  Sliders,
  Building2,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { teamService } from '../../services/teamService';
import { TeamMember } from '../../types';

export const OwnerTeamPage: React.FC = () => {
  const { resources, showToast } = useAppStore();
  const { currentUser: authUser } = useAuthStore();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Member Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'manager' | 'technician'>('manager');
  const [newDepartment, setNewDepartment] = useState('Makerspace Operations');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    canReviewRequests: true,
    canInspectReturns: true,
    canManageIncidents: true,
    canEditListings: false,
    canManageTeam: false,
  });

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const data = await teamService.getTeamMembers();
      setTeamMembers(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleTogglePermission = async (member: TeamMember, key: keyof TeamMember['permissions']) => {
    const updatedPermissions = {
      ...member.permissions,
      [key]: !member.permissions[key],
    };

    try {
      await teamService.updatePermissions(
        member.id,
        updatedPermissions,
        {
          id: authUser?.id || 'owner-1',
          name: authUser?.name || 'Owner',
          role: authUser?.role || 'owner',
        }
      );
      await fetchTeam();
      showToast(`Updated permissions for ${member.name}.`, 'success');
    } catch {
      showToast('Failed to update permission.', 'error');
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (member.role === 'owner') {
      showToast('Primary facility owner cannot be removed.', 'error');
      return;
    }

    if (window.confirm(`Revoke team access for ${member.name}?`)) {
      try {
        await teamService.removeTeamMember(member.id, {
          id: authUser?.id || 'owner-1',
          name: authUser?.name || 'Owner',
          role: authUser?.role || 'owner',
        });
        await fetchTeam();
        showToast(`Removed ${member.name} from lab team.`, 'info');
      } catch {
        showToast('Failed to remove team member.', 'error');
      }
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      showToast('Please provide a name and email.', 'error');
      return;
    }

    try {
      await teamService.addTeamMember(
        {
          name: newName,
          email: newEmail,
          role: newRole,
          department: newDepartment,
          assignedResourceIds: selectedResources.length > 0 ? selectedResources : resources.map((r) => r.id),
          permissions,
        },
        {
          id: authUser?.id || 'owner-1',
          name: authUser?.name || 'Owner',
          role: authUser?.role || 'owner',
        }
      );

      await fetchTeam();
      showToast(`Invited ${newName} as ${newRole}.`, 'success');
      setInviteModalOpen(false);
      setNewName('');
      setNewEmail('');
    } catch {
      showToast('Failed to invite team member.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Staff Roles & Operational Delegation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Lab Management Team
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Delegate reservation approvals, physical equipment inspections, and incident reviews to lab managers and student technicians.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Staff Member</span>
        </button>
      </div>

      {/* Team Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading lab staff roster...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {member.name}
                      </h3>
                      <p className="text-[11px] text-slate-500">{member.email}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      member.role === 'owner'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : member.role === 'manager'
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                        : 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Department:</span>{' '}
                  {member.department}
                </div>

                {/* Assigned Resources Count */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Assigned Facilities ({member.assignedResourceIds.length}):
                  </span>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {member.assignedResourceIds.slice(0, 3).map((rid) => {
                      const res = resources.find((r) => r.id === rid);
                      return (
                        <span
                          key={rid}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-[10px] border border-slate-200 dark:border-slate-600 truncate max-w-[140px]"
                        >
                          {res?.title || rid}
                        </span>
                      );
                    })}
                    {member.assignedResourceIds.length > 3 && (
                      <span className="text-[10px] text-slate-400">
                        +{member.assignedResourceIds.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Granular Permissions Toggles */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Permissions & Access Rights
                  </span>

                  <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Review Booking Requests</span>
                    <input
                      type="checkbox"
                      checked={member.permissions.canReviewRequests}
                      disabled={member.role === 'owner'}
                      onChange={() => handleTogglePermission(member, 'canReviewRequests')}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Inspect Returns & Sign Off</span>
                    <input
                      type="checkbox"
                      checked={member.permissions.canInspectReturns}
                      disabled={member.role === 'owner'}
                      onChange={() => handleTogglePermission(member, 'canInspectReturns')}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Manage Incidents & Disputes</span>
                    <input
                      type="checkbox"
                      checked={member.permissions.canManageIncidents}
                      disabled={member.role === 'owner'}
                      onChange={() => handleTogglePermission(member, 'canManageIncidents')}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Edit & Publish Listings</span>
                    <input
                      type="checkbox"
                      checked={member.permissions.canEditListings}
                      disabled={member.role === 'owner'}
                      onChange={() => handleTogglePermission(member, 'canEditListings')}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* Card Footer */}
              {member.role !== 'owner' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Access</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleInviteSubmit}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Add Lab Manager or Technician</span>
              </h3>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. m.lin@makerspace.edu"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="manager">Lab Manager</option>
                  <option value="technician">Student Technician</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                Add Staff Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
