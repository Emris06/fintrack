export interface ReminderRequest {
  description: string;
  amount?: number;
  currency?: string;
  reminderDate: string;
}

export interface ReminderResponse {
  id: number;
  description: string;
  amount?: number;
  currency?: string;
  reminderDate: string;
  createdAt: string;
}
