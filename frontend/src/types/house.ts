export interface HouseRequest {
  houseName: string;
  address?: string;
}

export interface HouseResponse {
  id: number;
  houseName: string;
  address?: string;
  totalDue: number;
  pendingBillsCount: number;
  servicesCount: number;
  createdAt: string;
}

export interface HouseServiceRequest {
  serviceName: string;
  providerName?: string;
  accountNumber?: string;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  averageAmount?: number;
}

export interface HouseServiceResponse {
  id: number;
  houseId: number;
  serviceName: string;
  providerName?: string;
  accountNumber?: string;
  billingCycle: string;
  averageAmount?: number;
  pendingAmount: number;
  pendingBillsCount: number;
  createdAt: string;
}

export interface BillRequest {
  amount: number;
  dueDate: string;
  description?: string;
}

export interface BillResponse {
  id: number;
  serviceId: number;
  serviceName: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID';
  description?: string;
  createdAt: string;
}

export interface PayBillRequest {
  accountId: number;
}

export interface BillPaymentResponse {
  id: number;
  billId: number;
  accountId: number;
  accountName: string;
  transactionId: number;
  amount: number;
  paymentDate: string;
}
