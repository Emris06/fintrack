import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as familyApi from '@/api/family-api';
import type { FamilyGroupRequest, InviteMemberRequest, ShareAccountRequest } from '@/types/family';
import { toast } from 'sonner';

export const familyKeys = {
  groups: ['family', 'groups'] as const,
  members: (groupId: number) => ['family', 'members', groupId] as const,
  sharedAccounts: (groupId: number) => ['family', 'shared-accounts', groupId] as const,
};

export function useFamilyGroups() {
  return useQuery({
    queryKey: familyKeys.groups,
    queryFn: familyApi.getMyGroups,
  });
}

export function useGroupMembers(groupId: number | null) {
  return useQuery({
    queryKey: familyKeys.members(groupId!),
    queryFn: () => familyApi.getGroupMembers(groupId!),
    enabled: !!groupId,
  });
}

export function useSharedAccounts(groupId: number | null) {
  return useQuery({
    queryKey: familyKeys.sharedAccounts(groupId!),
    queryFn: () => familyApi.getSharedAccounts(groupId!),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FamilyGroupRequest) => familyApi.createGroup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: familyKeys.groups });
      toast.success('Family group created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create group');
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => familyApi.deleteGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: familyKeys.groups });
      toast.success('Group deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    },
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: InviteMemberRequest }) =>
      familyApi.inviteMember(groupId, data),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: familyKeys.members(groupId) });
      qc.invalidateQueries({ queryKey: familyKeys.groups });
      toast.success('Member invited');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to invite member');
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: number; memberId: number }) =>
      familyApi.removeMember(groupId, memberId),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: familyKeys.members(groupId) });
      qc.invalidateQueries({ queryKey: familyKeys.groups });
      toast.success('Member removed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => familyApi.leaveGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: familyKeys.groups });
      toast.success('You left the group');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    },
  });
}

export function useShareAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: ShareAccountRequest }) =>
      familyApi.shareAccount(groupId, data),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: familyKeys.sharedAccounts(groupId) });
      toast.success('Account shared');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to share account');
    },
  });
}

export function useUnshareAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, accountId }: { groupId: number; accountId: number }) =>
      familyApi.unshareAccount(groupId, accountId),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: familyKeys.sharedAccounts(groupId) });
      toast.success('Account unshared');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unshare account');
    },
  });
}
