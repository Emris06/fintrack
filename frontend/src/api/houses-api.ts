import api from '@/lib/axios';
import type {
  ApiResponse,
  HouseRequest,
  HouseResponse,
  HouseServiceRequest,
  HouseServiceResponse,
  BillRequest,
  BillResponse,
  PayBillRequest,
  BillPaymentResponse,
} from '@/types';

// Houses
export const getHouses = () =>
  api.get<ApiResponse<HouseResponse[]>>('/api/houses').then((r) => r.data.data);

export const getHouse = (id: number) =>
  api.get<ApiResponse<HouseResponse>>(`/api/houses/${id}`).then((r) => r.data.data);

export const createHouse = (data: HouseRequest) =>
  api.post<ApiResponse<HouseResponse>>('/api/houses', data).then((r) => r.data.data);

export const updateHouse = (id: number, data: HouseRequest) =>
  api.put<ApiResponse<HouseResponse>>(`/api/houses/${id}`, data).then((r) => r.data.data);

export const deleteHouse = (id: number) =>
  api.delete(`/api/houses/${id}`);

// Services
export const getServices = (houseId: number) =>
  api.get<ApiResponse<HouseServiceResponse[]>>(`/api/houses/${houseId}/services`).then((r) => r.data.data);

export const createService = (houseId: number, data: HouseServiceRequest) =>
  api.post<ApiResponse<HouseServiceResponse>>(`/api/houses/${houseId}/services`, data).then((r) => r.data.data);

export const updateService = (houseId: number, serviceId: number, data: HouseServiceRequest) =>
  api.put<ApiResponse<HouseServiceResponse>>(`/api/houses/${houseId}/services/${serviceId}`, data).then((r) => r.data.data);

export const deleteService = (houseId: number, serviceId: number) =>
  api.delete(`/api/houses/${houseId}/services/${serviceId}`);

// Bills
export const getBills = (houseId: number, serviceId: number) =>
  api.get<ApiResponse<BillResponse[]>>(`/api/houses/${houseId}/services/${serviceId}/bills`).then((r) => r.data.data);

export const createBill = (houseId: number, serviceId: number, data: BillRequest) =>
  api.post<ApiResponse<BillResponse>>(`/api/houses/${houseId}/services/${serviceId}/bills`, data).then((r) => r.data.data);

export const updateBill = (billId: number, data: BillRequest) =>
  api.put<ApiResponse<BillResponse>>(`/api/houses/bills/${billId}`, data).then((r) => r.data.data);

export const deleteBill = (billId: number) =>
  api.delete(`/api/houses/bills/${billId}`);

// Pay
export const payBill = (billId: number, data: PayBillRequest) =>
  api.post<ApiResponse<BillPaymentResponse>>(`/api/houses/bills/${billId}/pay`, data).then((r) => r.data.data);
