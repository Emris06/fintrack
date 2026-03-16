import api from '@/lib/axios';
import type { ApiResponse, CarRequest, CarResponse, FineResponse } from '@/types';

export const getCars = () =>
  api.get<ApiResponse<CarResponse[]>>('/api/cars').then((r) => r.data.data);

export const createCar = (data: CarRequest) =>
  api.post<ApiResponse<CarResponse>>('/api/cars', data).then((r) => r.data.data);

export const deleteCar = (id: number) =>
  api.delete(`/api/cars/${id}`);

export const getCarFines = (carId: number) =>
  api.get<ApiResponse<FineResponse[]>>(`/api/cars/${carId}/fines`).then((r) => r.data.data);

export const payFine = (carId: number, fineId: number) =>
  api.post<ApiResponse<FineResponse>>(`/api/cars/${carId}/fines/${fineId}/pay`).then((r) => r.data.data);
