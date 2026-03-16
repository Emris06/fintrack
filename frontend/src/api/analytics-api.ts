import api from '@/lib/axios';
import type {
  ApiResponse,
  AnalyticsSummaryResponse,
  CategoryBreakdownResponse,
  CategoryComparisonResponse,
  TrendDataResponse,
  TrendGranularity,
  CalendarResponse,
} from '@/types';

const buildDateParams = (dateFrom?: string, dateTo?: string) => {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  return params.toString() ? `?${params}` : '';
};

export const getSummary = (dateFrom?: string, dateTo?: string) =>
  api.get<ApiResponse<AnalyticsSummaryResponse>>(`/api/analytics/summary${buildDateParams(dateFrom, dateTo)}`).then((r) => r.data.data);

export const getCategoryBreakdown = (dateFrom?: string, dateTo?: string) =>
  api.get<ApiResponse<CategoryBreakdownResponse[]>>(`/api/analytics/category-breakdown${buildDateParams(dateFrom, dateTo)}`).then((r) => r.data.data);

export const getTrend = (dateFrom?: string, dateTo?: string, granularity?: TrendGranularity) => {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  if (granularity) params.append('granularity', granularity);
  const query = params.toString() ? `?${params}` : '';
  return api.get<ApiResponse<TrendDataResponse>>(`/api/analytics/trend${query}`).then((r) => r.data.data);
};

export const getCategoryComparison = (dateFrom?: string, dateTo?: string) =>
  api.get<ApiResponse<CategoryComparisonResponse[]>>(`/api/analytics/category-comparison${buildDateParams(dateFrom, dateTo)}`).then((r) => r.data.data);

export const getCalendar = (year?: number, month?: number) => {
  const params = new URLSearchParams();
  if (year) params.append('year', String(year));
  if (month) params.append('month', String(month));
  const query = params.toString() ? `?${params}` : '';
  return api.get<ApiResponse<CalendarResponse>>(`/api/analytics/calendar${query}`).then((r) => r.data.data);
};

export const getSavingsRate = (dateFrom?: string, dateTo?: string) =>
  api.get<ApiResponse<AnalyticsSummaryResponse>>(`/api/analytics/savings-rate${buildDateParams(dateFrom, dateTo)}`).then((r) => r.data.data);
