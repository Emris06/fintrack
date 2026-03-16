export const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  CARD: 'CreditCard',
  CASH: 'Banknote',
  ACCOUNT: 'Building2',
  SAVINGS: 'PiggyBank',
  INVESTMENT: 'TrendingUp',
};

export const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  INCOME: 'text-emerald-600',
  EXPENSE: 'text-red-500',
  TRANSFER_IN: 'text-blue-500',
  TRANSFER_OUT: 'text-purple-400',
};

export const DEBT_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  OVERDUE: 'bg-red-100 text-red-700',
};

export const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  BUDGET_WARNING: 'AlertTriangle',
  BUDGET_EXCEEDED: 'AlertOctagon',
  ANOMALY: 'Activity',
  BILL_REMINDER: 'Bell',
  SYSTEM: 'Info',
};

// Currency display config: locale and fraction digits per currency
const CURRENCY_CONFIG: Record<string, { locale: string; minFrac: number; maxFrac: number }> = {
  USD: { locale: 'en-US', minFrac: 0, maxFrac: 2 },
  UZS: { locale: 'uz-UZ', minFrac: 0, maxFrac: 0 }, // UZS amounts are large, no decimals
  RUB: { locale: 'ru-RU', minFrac: 0, maxFrac: 2 },
};

export const SUPPORTED_CURRENCIES = ['USD', 'UZS', 'RUB'] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  UZS: "so'm",
  RUB: '₽',
};

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const config = CURRENCY_CONFIG[currency] ?? { locale: 'en-US', minFrac: 0, maxFrac: 2 };
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: config.minFrac,
    maximumFractionDigits: config.maxFrac,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}
