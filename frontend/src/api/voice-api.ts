import api from '@/lib/axios';
import type { ApiResponse } from '@/types';
import type { VoiceCommandRequest, VoiceConfirmRequest, VoiceCommandResponse } from '@/types/voice';

export const sendCommand = (data: VoiceCommandRequest) =>
  api.post<ApiResponse<VoiceCommandResponse>>('/api/voice/command', data).then((r) => r.data.data);

export const confirmAction = (data: VoiceConfirmRequest) =>
  api.post<ApiResponse<VoiceCommandResponse>>('/api/voice/confirm', data).then((r) => r.data.data);
