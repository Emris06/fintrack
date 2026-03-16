export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface BudgetRequest {
  categoryId: number;
  name: string;
  amountLimit: number;
  currency: string;
  periodType: BudgetPeriod;
  startDate: string;
  endDate?: string;
}

export interface BudgetResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  amountLimit: number;
  currency: string;
  periodType: BudgetPeriod;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  spent: number;
  remaining: number;
  percentUsed: number;
}
