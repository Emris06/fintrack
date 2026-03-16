export interface TransferRequest {
  sourceAccountId: number;
  targetAccountId: number;
  amount: number;
  description?: string;
  idempotencyKey: string;
  transferDate: string;
}

export interface TransferResponse {
  id: number;
  sourceAccountId: number;
  sourceAccountName: string;
  targetAccountId: number;
  targetAccountName: string;
  sourceAmount: number;
  targetAmount: number;
  exchangeRate: number;
  sourceCurrency: string;
  targetCurrency: string;
  description?: string;
  transferDate: string;
  createdAt: string;
}
