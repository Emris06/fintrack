import api from '@/lib/axios';
import type { ApiResponse, AccountRequest, AccountResponse } from '@/types';

export const getAccounts = () =>
  api.get<ApiResponse<AccountResponse[]>>('/api/accounts').then((r) => r.data.data);

export const getAccount = (id: number) =>
  api.get<ApiResponse<AccountResponse>>(`/api/accounts/${id}`).then((r) => r.data.data);

export const createAccount = (data: AccountRequest) =>
  api.post<ApiResponse<AccountResponse>>('/api/accounts', data).then((r) => r.data.data);

export const updateAccount = (id: number, data: AccountRequest) =>
  api.put<ApiResponse<AccountResponse>>(`/api/accounts/${id}`, data).then((r) => r.data.data);

export const deleteAccount = (id: number) =>
  api.delete(`/api/accounts/${id}`);

export const getBalanceSummary = () =>
  api.get<ApiResponse<Record<string, number>>>('/api/accounts/balance-summary').then((r) => r.data.data);
