import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as housesApi from '@/api/houses-api';
import type { HouseRequest, HouseServiceRequest, BillRequest, PayBillRequest } from '@/types';
import { toast } from 'sonner';
import { accountKeys } from './use-accounts';

export const houseKeys = {
  all: ['houses'] as const,
  detail: (id: number) => ['houses', id] as const,
  services: (houseId: number) => ['houses', houseId, 'services'] as const,
  bills: (houseId: number, serviceId: number) => ['houses', houseId, 'services', serviceId, 'bills'] as const,
};

// ─── Houses ──────────────────────────────────────────────

export function useHouses() {
  return useQuery({
    queryKey: houseKeys.all,
    queryFn: housesApi.getHouses,
  });
}

export function useHouse(id: number) {
  return useQuery({
    queryKey: houseKeys.detail(id),
    queryFn: () => housesApi.getHouse(id),
    enabled: !!id,
  });
}

export function useCreateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HouseRequest) => housesApi.createHouse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseKeys.all });
      toast.success('House added');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add house');
    },
  });
}

export function useUpdateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: HouseRequest }) => housesApi.updateHouse(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseKeys.all });
      toast.success('House updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update house');
    },
  });
}

export function useDeleteHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => housesApi.deleteHouse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseKeys.all });
      toast.success('House removed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove house');
    },
  });
}

// ─── Services ────────────────────────────────────────────

export function useHouseServices(houseId: number) {
  return useQuery({
    queryKey: houseKeys.services(houseId),
    queryFn: () => housesApi.getServices(houseId),
    enabled: !!houseId,
  });
}

export function useCreateService(houseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HouseServiceRequest) => housesApi.createService(houseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseKeys.services(houseId) });
      qc.invalidateQueries({ queryKey: houseKeys.all });
      toast.success('Service added');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add service');
    },
  });
}

export function useDeleteService(houseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: number) => housesApi.deleteService(houseId, serviceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseKeys.services(houseId) });
      qc.invalidateQueries({ queryKey: houseKeys.all });
      toast.success('Service removed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove service');
    },
  });
}

// ─── Bills ───────────────────────────────────────────────

export function useBills(houseId: number, serviceId: number) {
  return useQuery({
    queryKey: houseKeys.bills(houseId, serviceId),
    queryFn: () => housesApi.getBills(houseId, serviceId),
    enabled: !!houseId && !!serviceId,
  });
}

export function useCreateBill(houseId: number, serviceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BillRequest) => housesApi.createBill(houseId, serviceId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: houseKeys.bills(houseId, serviceId) });
      qc.invalidateQueries({ queryKey: houseKeys.services(houseId) });
      qc.invalidateQueries({ queryKey: houseKeys.all });
      toast.success('Bill added');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add bill');
    },
  });
}

// ─── Pay Bill ────────────────────────────────────────────

export function usePayBill(_houseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, data }: { billId: number; data: PayBillRequest }) => housesApi.payBill(billId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['houses'] });
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.invalidateQueries({ queryKey: accountKeys.balanceSummary });
      toast.success('Bill paid successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to pay bill');
    },
  });
}
