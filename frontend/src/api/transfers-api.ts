import api from '@/lib/axios';
import type { ApiResponse, PageResponse, TransferRequest, TransferResponse } from '@/types';

export const createTransfer = (data: TransferRequest) =>
  api.post<ApiResponse<TransferResponse>>('/api/transfers', data).then((r) => r.data.data);

export const getTransfers = (page = 0, size = 20) =>
  api.get<ApiResponse<PageResponse<TransferResponse>>>(`/api/transfers?page=${page}&size=${size}`).then((r) => r.data.data);

export const getTransfer = (id: number) =>
  api.get<ApiResponse<TransferResponse>>(`/api/transfers/${id}`).then((r) => r.data.data);
