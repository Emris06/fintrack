import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as debtsApi from '@/api/debts-api';
import type { DebtRequest } from '@/types';
import { toast } from 'sonner';

export function useDebts() {
  return useQuery({
    queryKey: ['debts'],
    queryFn: debtsApi.getDebts,
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DebtRequest) => debtsApi.createDebt(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Debt added');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add debt');
    },
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DebtRequest }) => debtsApi.updateDebt(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Debt updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update debt');
    },
  });
}

export function useCloseDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => debtsApi.closeDebt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Debt closed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to close debt');
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => debtsApi.deleteDebt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Debt deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete debt');
    },
  });
}
