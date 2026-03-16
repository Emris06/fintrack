export interface CarRequest {
  licensePlate: string;
  registrationCertificate?: string;
  nickname?: string;
}

export interface CarResponse {
  id: number;
  licensePlate: string;
  registrationCertificate?: string;
  nickname?: string;
  unpaidFinesTotal: number;
  unpaidFinesCount: number;
  createdAt: string;
}

export interface FineResponse {
  id: number;
  carId: number;
  violationType: string;
  amount: number;
  fineDate: string;
  status: 'PAID' | 'UNPAID';
  paidAt?: string;
  createdAt: string;
}
