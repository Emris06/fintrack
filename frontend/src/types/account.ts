export type AccountType = 'CARD' | 'CASH' | 'ACCOUNT' | 'SAVINGS' | 'INVESTMENT';

export interface AccountRequest {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance?: number;
  icon?: string;
  color?: string;
}

export interface AccountResponse {
  id: number;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  initialBalance: number;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
}
