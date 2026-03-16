import api from '@/lib/axios';
import type { ApiResponse, BudgetRequest, BudgetResponse } from '@/types';

export const getBudgets = () =>
  api.get<ApiResponse<BudgetResponse[]>>('/api/budgets').then((r) => r.data.data);

export const getBudget = (id: number) =>
  api.get<ApiResponse<BudgetResponse>>(`/api/budgets/${id}`).then((r) => r.data.data);

export const createBudget = (data: BudgetRequest) =>
  api.post<ApiResponse<BudgetResponse>>('/api/budgets', data).then((r) => r.data.data);

export const updateBudget = (id: number, data: BudgetRequest) =>
  api.put<ApiResponse<BudgetResponse>>(`/api/budgets/${id}`, data).then((r) => r.data.data);

export const deleteBudget = (id: number) =>
  api.delete(`/api/budgets/${id}`);

export const getBudgetPerformance = () =>
  api.get<ApiResponse<BudgetResponse[]>>('/api/budgets/performance').then((r) => r.data.data);
