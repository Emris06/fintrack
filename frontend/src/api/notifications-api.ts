import api from '@/lib/axios';
import type { ApiResponse, NotificationResponse } from '@/types';

export const getNotifications = () =>
  api.get<ApiResponse<NotificationResponse[]>>('/api/notifications').then((r) => r.data.data);

export const getUnreadCount = () =>
  api.get<ApiResponse<number>>('/api/notifications/unread-count').then((r) => r.data.data);

export const markAsRead = (id: number) =>
  api.patch<ApiResponse<NotificationResponse>>(`/api/notifications/${id}/read`).then((r) => r.data.data);

export const markAllAsRead = () =>
  api.patch<ApiResponse<number>>('/api/notifications/read-all').then((r) => r.data.data);
