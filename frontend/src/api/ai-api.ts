import api from '@/lib/axios';
import type { ApiResponse, AiInsightResponse, CategoryResponse } from '@/types';

export const predictCategory = (description: string) =>
  api.get<ApiResponse<CategoryResponse>>(`/api/ai/predict-category?description=${encodeURIComponent(description)}`).then((r) => r.data.data);

export const getAnomalies = () =>
  api.get<ApiResponse<AiInsightResponse[]>>('/api/ai/anomalies').then((r) => r.data.data);

export const getInsights = () =>
  api.get<ApiResponse<AiInsightResponse[]>>('/api/ai/insights').then((r) => r.data.data);
