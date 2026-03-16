export type CategoryType = 'INCOME' | 'EXPENSE' | 'BOTH';

export interface CategoryResponse {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  type: CategoryType;
  isSystem: boolean;
}
