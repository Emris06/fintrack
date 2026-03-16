export interface AnalyticsSummaryResponse {
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  savingsRate: number;
  period: string;
}

export interface CategoryBreakdownResponse {
  categoryId: number;
  categoryName: string;
  categoryColor?: string;
  categoryIcon?: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface TrendDataResponse {
  points: TrendPoint[];
}

export interface TrendPoint {
  date: string;
  income: number;
  expense: number;
}

export type TrendGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface CategoryComparisonResponse {
  categoryId: number;
  categoryName: string;
  categoryColor?: string;
  categoryIcon?: string;
  income: number;
  expense: number;
}

export interface CalendarDayData {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface CalendarResponse {
  year: number;
  month: number;
  days: CalendarDayData[];
}
