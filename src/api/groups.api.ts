import { api } from '@/lib/api';
import { GroupChat, GroupMessage, GroupInvite } from '@/types';

export const groupsApi = {
  getMyGroups: () =>
    api.get<GroupChat[]>('/groups').then((r) => r.data),

  createGroup: (name: string, description?: string) =>
    api.post<GroupChat>('/groups', { name, description }).then((r) => r.data),

  getGroupDetails: (groupId: string) =>
    api.get<any>(`/groups/${groupId}`).then((r) => r.data),

  getMessages: (groupId: string, params?: { limit?: number; before?: string }) =>
    api.get<GroupMessage[]>(`/groups/${groupId}/messages`, { params }).then((r) => r.data),

  inviteUser: (groupId: string, userId: string) =>
    api.post<GroupInvite>(`/groups/${groupId}/invite/${userId}`).then((r) => r.data),

  requestJoin: (groupId: string) =>
    api.post<GroupInvite>(`/groups/${groupId}/request`).then((r) => r.data),

  respondToInvite: (inviteId: string, accept: boolean) =>
    api.patch(`/groups/invites/${inviteId}`, { accept }).then((r) => r.data),

  getMyInvites: () =>
    api.get<GroupInvite[]>('/groups/invites/mine').then((r) => r.data),

  leaveGroup: (groupId: string) =>
    api.delete(`/groups/${groupId}/leave`).then((r) => r.data),
};
