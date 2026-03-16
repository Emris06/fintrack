export interface VoiceCommandRequest {
  text: string;
}

export interface VoiceConfirmRequest {
  pendingActionId: string;
  confirmed: boolean;
}

export interface VoiceCommandResponse {
  message: string;
  intent: string;
  requiresConfirmation: boolean;
  pendingActionId?: string;
  parsedData?: Record<string, unknown>;
  resultData?: Record<string, unknown>;
  navigateTo?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  requiresConfirmation?: boolean;
  pendingActionId?: string;
  confirmed?: boolean;
  isLoading?: boolean;
  navigateTo?: string;
}
