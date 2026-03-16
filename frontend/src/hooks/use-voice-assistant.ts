import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as voiceApi from '@/api/voice-api';
import type { VoiceCommandRequest, VoiceConfirmRequest } from '@/types/voice';

export function useSendCommand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VoiceCommandRequest) => voiceApi.sendCommand(data),
    onSuccess: (data) => {
      // Invalidate relevant queries after successful write operations
      if (!data.requiresConfirmation && data.intent !== 'unknown') {
        invalidateAll(qc);
      }
    },
  });
}

export function useConfirmAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VoiceConfirmRequest) => voiceApi.confirmAction(data),
    onSuccess: (data) => {
      if (data.intent !== 'error') {
        invalidateAll(qc);
      }
    },
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['accounts'] });
  qc.invalidateQueries({ queryKey: ['transactions'] });
  qc.invalidateQueries({ queryKey: ['transfers'] });
  qc.invalidateQueries({ queryKey: ['debts'] });
  qc.invalidateQueries({ queryKey: ['budgets'] });
  qc.invalidateQueries({ queryKey: ['reminders'] });
  qc.invalidateQueries({ queryKey: ['analytics'] });
  qc.invalidateQueries({ queryKey: ['notifications'] });
}
