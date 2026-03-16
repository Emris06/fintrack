import { create } from 'zustand';
import type { ChatMessage } from '@/types/voice';

interface VoiceState {
  isOpen: boolean;
  messages: ChatMessage[];
  setOpen: (open: boolean) => void;
  toggle: () => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
}

export const useVoiceStore = create<VoiceState>()((set) => ({
  isOpen: false,
  messages: [],
  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  clearMessages: () => set({ messages: [] }),
}));
