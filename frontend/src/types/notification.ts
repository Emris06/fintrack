export type NotificationType = 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | 'ANOMALY' | 'BILL_REMINDER' | 'SYSTEM';

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
