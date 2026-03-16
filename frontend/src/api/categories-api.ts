import api from '@/lib/axios';
import type { ApiResponse, CategoryResponse } from '@/types';

export const getCategories = () =>
  api.get<ApiResponse<CategoryResponse[]>>('/api/categories').then((r) => r.data.data);

export const getSystemCategories = () =>
  api.get<ApiResponse<CategoryResponse[]>>('/api/categories/system').then((r) => r.data.data);
