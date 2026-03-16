export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface TransactionRequest {
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  description?: string;
  note?: string;
  transactionDate: string;
}

export interface TransactionResponse {
  id: number;
  accountId: number;
  accountName: string;
  categoryId: number;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  type: TransactionType;
  amount: number;
  accountCurrency?: string;
  description?: string;
  note?: string;
  transactionDate: string;
  createdAt: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  accountId?: number;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}
