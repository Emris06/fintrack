import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as carsApi from '@/api/cars-api';
import type { CarRequest } from '@/types';
import { toast } from 'sonner';

export const carKeys = {
  all: ['cars'] as const,
  fines: (carId: number) => ['cars', carId, 'fines'] as const,
};

export function useCars() {
  return useQuery({
    queryKey: carKeys.all,
    queryFn: carsApi.getCars,
  });
}

export function useCreateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CarRequest) => carsApi.createCar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carKeys.all });
      toast.success('Car added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add car');
    },
  });
}

export function useDeleteCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => carsApi.deleteCar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carKeys.all });
      toast.success('Car removed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove car');
    },
  });
}

export function useCarFines(carId: number) {
  return useQuery({
    queryKey: carKeys.fines(carId),
    queryFn: () => carsApi.getCarFines(carId),
    enabled: !!carId,
  });
}

export function usePayFine(carId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fineId: number) => carsApi.payFine(carId, fineId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carKeys.fines(carId) });
      qc.invalidateQueries({ queryKey: carKeys.all });
      toast.success('Fine paid successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to pay fine');
    },
  });
}
