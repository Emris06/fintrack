export type DebtType = 'DEBT' | 'RECEIVABLE';
export type DebtStatus = 'OPEN' | 'CLOSED' | 'OVERDUE';

export interface DebtRequest {
  type: DebtType;
  personName: string;
  amount: number;
  currency: string;
  description?: string;
  dueDate?: string;
}

export interface DebtResponse {
  id: number;
  type: DebtType;
  personName: string;
  amount: number;
  currency: string;
  description?: string;
  dueDate?: string;
  status: DebtStatus;
  closedAt?: string;
  createdAt: string;
}
