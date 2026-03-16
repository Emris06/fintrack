import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as accountsApi from '@/api/accounts-api';
import type { AccountRequest } from '@/types';
import { toast } from 'sonner';

export const accountKeys = {
  all: ['accounts'] as const,
  detail: (id: number) => ['accounts', id] as const,
  balanceSummary: ['accounts', 'balance-summary'] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: accountsApi.getAccounts,
  });
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountsApi.getAccount(id),
    enabled: !!id,
  });
}

export function useBalanceSummary() {
  return useQuery({
    queryKey: accountKeys.balanceSummary,
    queryFn: accountsApi.getBalanceSummary,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountRequest) => accountsApi.createAccount(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.invalidateQueries({ queryKey: accountKeys.balanceSummary });
      toast.success('Account created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create account');
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccountRequest }) => accountsApi.updateAccount(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.invalidateQueries({ queryKey: accountKeys.detail(id) });
      qc.invalidateQueries({ queryKey: accountKeys.balanceSummary });
      toast.success('Account updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update account');
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountsApi.deleteAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.invalidateQueries({ queryKey: accountKeys.balanceSummary });
      toast.success('Account deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    },
  });
}
