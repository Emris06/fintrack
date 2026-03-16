import api from '@/lib/axios';
import type { ApiResponse } from '@/types';

export const getRates = () =>
  api.get<ApiResponse<Record<string, number>>>('/api/currency/rates').then((r) => r.data.data);

export const convert = (amount: number, from: string, to: string) =>
  api.get<ApiResponse<number>>('/api/currency/convert', {
    params: { amount, from, to },
  }).then((r) => r.data.data);

export const getSupportedCurrencies = () =>
  api.get<ApiResponse<string[]>>('/api/currency/supported').then((r) => r.data.data);
