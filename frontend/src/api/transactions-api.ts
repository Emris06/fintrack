import api from '@/lib/axios';
import type { ApiResponse, PageResponse, TransactionRequest, TransactionResponse, TransactionFilters } from '@/types';

export const getTransactions = (filters: TransactionFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.accountId) params.append('accountId', String(filters.accountId));
  if (filters.categoryId) params.append('categoryId', String(filters.categoryId));
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  params.append('page', String(filters.page ?? 0));
  params.append('size', String(filters.size ?? 20));

  return api.get<ApiResponse<PageResponse<TransactionResponse>>>(`/api/transactions?${params}`).then((r) => r.data.data);
};

export const getTransaction = (id: number) =>
  api.get<ApiResponse<TransactionResponse>>(`/api/transactions/${id}`).then((r) => r.data.data);

export const createTransaction = (data: TransactionRequest) =>
  api.post<ApiResponse<TransactionResponse>>('/api/transactions', data).then((r) => r.data.data);

export const updateTransaction = (id: number, data: TransactionRequest) =>
  api.put<ApiResponse<TransactionResponse>>(`/api/transactions/${id}`, data).then((r) => r.data.data);

export const deleteTransaction = (id: number) =>
  api.delete(`/api/transactions/${id}`);
