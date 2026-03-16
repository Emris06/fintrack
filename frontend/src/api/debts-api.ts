import api from '@/lib/axios';
import type { ApiResponse, DebtRequest, DebtResponse } from '@/types';

export const getDebts = () =>
  api.get<ApiResponse<DebtResponse[]>>('/api/debts').then((r) => r.data.data);

export const getDebt = (id: number) =>
  api.get<ApiResponse<DebtResponse>>(`/api/debts/${id}`).then((r) => r.data.data);

export const createDebt = (data: DebtRequest) =>
  api.post<ApiResponse<DebtResponse>>('/api/debts', data).then((r) => r.data.data);

export const updateDebt = (id: number, data: DebtRequest) =>
  api.put<ApiResponse<DebtResponse>>(`/api/debts/${id}`, data).then((r) => r.data.data);

export const closeDebt = (id: number) =>
  api.patch<ApiResponse<DebtResponse>>(`/api/debts/${id}/close`).then((r) => r.data.data);

export const deleteDebt = (id: number) =>
  api.delete(`/api/debts/${id}`);
