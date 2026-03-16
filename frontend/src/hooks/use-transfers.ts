import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as transfersApi from '@/api/transfers-api';
import type { TransferRequest } from '@/types';
import { accountKeys } from './use-accounts';
import { toast } from 'sonner';

export function useTransfers(page = 0, size = 20) {
  return useQuery({
    queryKey: ['transfers', { page, size }],
    queryFn: () => transfersApi.getTransfers(page, size),
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TransferRequest) => transfersApi.createTransfer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.invalidateQueries({ queryKey: accountKeys.balanceSummary });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transfer completed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Transfer failed');
    },
  });
}
