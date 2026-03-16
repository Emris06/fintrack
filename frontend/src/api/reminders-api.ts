import api from '@/lib/axios';
import type { ApiResponse } from '@/types';
import type { ReminderRequest, ReminderResponse } from '@/types/reminder';

export const getRemindersByMonth = (year: number, month: number) =>
  api
    .get<ApiResponse<ReminderResponse[]>>('/api/reminders', { params: { year, month } })
    .then((r) => r.data.data);

export const getRemindersByDate = (date: string) =>
  api
    .get<ApiResponse<ReminderResponse[]>>('/api/reminders/by-date', { params: { date } })
    .then((r) => r.data.data);

export const createReminder = (data: ReminderRequest) =>
  api.post<ApiResponse<ReminderResponse>>('/api/reminders', data).then((r) => r.data.data);

export const deleteReminder = (id: number) =>
  api.delete<ApiResponse<void>>(`/api/reminders/${id}`).then((r) => r.data.data);
