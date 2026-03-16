import api from '@/lib/axios';
import type { ApiResponse } from '@/types';
import type {
  FamilyGroupResponse,
  FamilyMemberResponse,
  SharedAccountResponse,
  FamilyGroupRequest,
  InviteMemberRequest,
  ShareAccountRequest,
} from '@/types/family';

export const getMyGroups = () =>
  api.get<ApiResponse<FamilyGroupResponse[]>>('/api/family/groups').then((r) => r.data.data);

export const createGroup = (data: FamilyGroupRequest) =>
  api.post<ApiResponse<FamilyGroupResponse>>('/api/family/groups', data).then((r) => r.data.data);

export const deleteGroup = (groupId: number) =>
  api.delete<ApiResponse<void>>(`/api/family/groups/${groupId}`).then((r) => r.data.data);

export const getGroupMembers = (groupId: number) =>
  api.get<ApiResponse<FamilyMemberResponse[]>>(`/api/family/groups/${groupId}/members`).then((r) => r.data.data);

export const inviteMember = (groupId: number, data: InviteMemberRequest) =>
  api.post<ApiResponse<FamilyMemberResponse>>(`/api/family/groups/${groupId}/members`, data).then((r) => r.data.data);

export const removeMember = (groupId: number, memberId: number) =>
  api.delete<ApiResponse<void>>(`/api/family/groups/${groupId}/members/${memberId}`).then((r) => r.data.data);

export const leaveGroup = (groupId: number) =>
  api.post<ApiResponse<void>>(`/api/family/groups/${groupId}/leave`).then((r) => r.data.data);

export const getSharedAccounts = (groupId: number) =>
  api.get<ApiResponse<SharedAccountResponse[]>>(`/api/family/groups/${groupId}/accounts`).then((r) => r.data.data);

export const shareAccount = (groupId: number, data: ShareAccountRequest) =>
  api.post<ApiResponse<SharedAccountResponse>>(`/api/family/groups/${groupId}/accounts`, data).then((r) => r.data.data);

export const unshareAccount = (groupId: number, accountId: number) =>
  api.delete<ApiResponse<void>>(`/api/family/groups/${groupId}/accounts/${accountId}`).then((r) => r.data.data);
