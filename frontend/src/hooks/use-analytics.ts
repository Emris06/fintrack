import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '@/api/analytics-api';
import type { TrendGranularity } from '@/types';

export function useAnalyticsSummary(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['analytics', 'summary', { dateFrom, dateTo }],
    queryFn: () => analyticsApi.getSummary(dateFrom, dateTo),
  });
}

export function useCategoryBreakdown(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['analytics', 'category-breakdown', { dateFrom, dateTo }],
    queryFn: () => analyticsApi.getCategoryBreakdown(dateFrom, dateTo),
  });
}

export function useTrend(dateFrom?: string, dateTo?: string, granularity?: TrendGranularity) {
  return useQuery({
    queryKey: ['analytics', 'trend', { dateFrom, dateTo, granularity }],
    queryFn: () => analyticsApi.getTrend(dateFrom, dateTo, granularity),
  });
}

export function useCategoryComparison(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['analytics', 'category-comparison', { dateFrom, dateTo }],
    queryFn: () => analyticsApi.getCategoryComparison(dateFrom, dateTo),
  });
}

export function useCalendar(year?: number, month?: number) {
  return useQuery({
    queryKey: ['analytics', 'calendar', { year, month }],
    queryFn: () => analyticsApi.getCalendar(year, month),
  });
}

export function useSavingsRate(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['analytics', 'savings-rate', { dateFrom, dateTo }],
    queryFn: () => analyticsApi.getSavingsRate(dateFrom, dateTo),
  });
}
