import { TeamMember } from '../types';
import { logEvent } from './auditService';

const STORAGE_KEY = 'LENDSPACE_TEAM_v1';
const delay = (ms: number = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Dr. Ramesh Rao',
    email: 'r.rao@makerspace.edu',
    role: 'owner',
    department: 'Electrical & Computer Engineering',
    assignedResourceIds: ['res-prusa-mk4', 'res-laser-60w', 'res-gpu-workstation'],
    permissions: {
      canReviewRequests: true,
      canInspectReturns: true,
      canManageIncidents: true,
      canEditListings: true,
      canManageTeam: true,
    },
    status: 'active',
    addedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'team-2',
    name: 'Kiran Verma',
    email: 'kiran.v@makerspace.edu',
    role: 'manager',
    department: 'Makerspace Facility Operations',
    assignedResourceIds: ['res-prusa-mk4', 'res-laser-60w', 'res-soldering-station'],
    permissions: {
      canReviewRequests: true,
      canInspectReturns: true,
      canManageIncidents: true,
      canEditListings: false,
      canManageTeam: false,
    },
    status: 'active',
    addedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'team-3',
    name: 'Alex Rivera',
    email: 'alex.r@makerspace.edu',
    role: 'technician',
    department: 'Precision Prototyping Workshop',
    assignedResourceIds: ['res-prusa-mk4', 'res-soldering-station'],
    permissions: {
      canReviewRequests: false,
      canInspectReturns: true,
      canManageIncidents: true,
      canEditListings: false,
      canManageTeam: false,
    },
    status: 'active',
    addedAt: '2026-02-01T00:00:00.000Z',
  },
];

const getStoredTeam = (): TeamMember[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEAM));
      return INITIAL_TEAM;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEAM;
  }
};

const saveTeam = (team: TeamMember[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
};

export const teamService = {
  async getTeamMembers(): Promise<TeamMember[]> {
    await delay(300);
    return getStoredTeam();
  },

  async addTeamMember(
    member: Omit<TeamMember, 'id' | 'status' | 'addedAt'>,
    creator: { id: string; name: string; role: string }
  ): Promise<TeamMember> {
    await delay(500);
    const team = getStoredTeam();
    const newMember: TeamMember = {
      ...member,
      id: `team-${Date.now()}`,
      status: 'active',
      addedAt: new Date().toISOString(),
    };

    team.push(newMember);
    saveTeam(team);

    await logEvent(
      creator,
      'TEAM_MEMBER_ADDED',
      newMember.id,
      'user',
      `Invited ${newMember.name} as ${newMember.role}`,
      { email: newMember.email, role: newMember.role }
    );

    return newMember;
  },

  async updatePermissions(
    memberId: string,
    permissions: TeamMember['permissions'],
    updater: { id: string; name: string; role: string }
  ): Promise<TeamMember> {
    await delay(400);
    const team = getStoredTeam();
    const index = team.findIndex((t) => t.id === memberId);
    if (index === -1) throw new Error('Team member not found');

    team[index].permissions = permissions;
    saveTeam(team);

    await logEvent(
      updater,
      'TEAM_PERMISSIONS_UPDATED',
      memberId,
      'user',
      `Updated permissions for ${team[index].name}`
    );

    return team[index];
  },

  async removeTeamMember(
    memberId: string,
    remover: { id: string; name: string; role: string }
  ): Promise<void> {
    await delay(400);
    let team = getStoredTeam();
    const target = team.find((t) => t.id === memberId);
    team = team.filter((t) => t.id !== memberId);
    saveTeam(team);

    if (target) {
      await logEvent(
        remover,
        'TEAM_MEMBER_REMOVED',
        memberId,
        'user',
        `Removed ${target.name} (${target.email}) from lab management team`
      );
    }
  },
};
