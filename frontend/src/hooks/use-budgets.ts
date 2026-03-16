import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as budgetsApi from '@/api/budgets-api';
import type { BudgetRequest } from '@/types';
import { toast } from 'sonner';

export const budgetKeys = {
  all: ['budgets'] as const,
  performance: ['budgets', 'performance'] as const,
};

export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.all,
    queryFn: budgetsApi.getBudgets,
  });
}

export function useBudgetPerformance() {
  return useQuery({
    queryKey: budgetKeys.performance,
    queryFn: budgetsApi.getBudgetPerformance,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BudgetRequest) => budgetsApi.createBudget(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetKeys.all });
      toast.success('Budget created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create budget');
    },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BudgetRequest }) => budgetsApi.updateBudget(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetKeys.all });
      toast.success('Budget updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update budget');
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetsApi.deleteBudget(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: budgetKeys.all });
      toast.success('Budget deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete budget');
    },
  });
}
