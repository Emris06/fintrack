import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as remindersApi from '@/api/reminders-api';
import type { ReminderRequest } from '@/types/reminder';

export function useRemindersByMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['reminders', year, month],
    queryFn: () => remindersApi.getRemindersByMonth(year, month),
  });
}

export function useRemindersByDate(date: string | null) {
  return useQuery({
    queryKey: ['reminders', 'date', date],
    queryFn: () => remindersApi.getRemindersByDate(date!),
    enabled: !!date,
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReminderRequest) => remindersApi.createReminder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => remindersApi.deleteReminder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}
