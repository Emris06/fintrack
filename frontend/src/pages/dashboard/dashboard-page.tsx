import { useState } from 'react';
import { Link } from 'react-router';
import { useBalanceSummary } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useConvert } from '@/hooks/use-currency';
import { useAuthStore } from '@/store/auth-store';
import { formatCurrency, formatDate, TRANSACTION_TYPE_COLORS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Eye,
  EyeOff,
  Plus,
  ArrowLeftRight,
  Menu,
} from 'lucide-react';
import { CategoryIcon } from '@/components/shared/category-icon';
import { useAppStore } from '@/store/app-store';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: balanceSummary, isLoading: summaryLoading } = useBalanceSummary();
  const { data: transactions, isLoading: txLoading } = useTransactions({ size: 10 });
  const { data: unreadCount } = useUnreadCount();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const convert = useConvert();
  const defaultCurrency = user?.defaultCurrency ?? 'USD';

  const balanceEntries = balanceSummary ? Object.entries(balanceSummary) : [];

  // Calculate total balance converted to user's default currency
  const totalBalance = balanceEntries.reduce((sum, [currency, total]) => {
    const converted = convert(total, currency, defaultCurrency);
    return converted != null ? sum + converted : sum;
  }, 0);

  return (
    <div>
      {/* Hero Section */}
      <div className="px-5 pt-6 pb-14 text-foreground">
        {/* Top Nav Bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold flex-1">
            Welcome, {user?.fullName?.split(' ')[0] ?? 'User'}
          </h1>
          <Link to="/notifications" className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm">
            <Bell className="h-5 w-5" />
            {unreadCount ? (
              <span className="absolute -top-2 -right-2 bg-destructive text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </Link>
        </div>

        {/* Balance */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">Account Balance</p>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {balanceVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-10 w-48" />
          ) : balanceEntries.length === 0 ? (
            <p className="text-4xl font-bold tracking-tight">
              {balanceVisible ? formatCurrency(0, 'USD') : '••••••'}
            </p>
          ) : (
            <p className="text-4xl font-bold tracking-tight">
              {balanceVisible ? formatCurrency(totalBalance, defaultCurrency) : '••••••'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            to="/transactions"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm py-3 text-sm font-semibold hover:bg-white/15 transition-colors"
          >
            <Plus className="h-4 w-4" />
            ADD TRANSACTION
          </Link>
          <Link
            to="/transfers"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm py-3 text-sm font-semibold hover:bg-white/15 transition-colors"
          >
            <ArrowLeftRight className="h-4 w-4" />
            TRANSFER
          </Link>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-card text-card-foreground -mt-6 rounded-t-3xl min-h-[50vh] px-5 pt-6 pb-6 border border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">All Transactions</h2>
          <Link
            to="/transactions"
            className="text-sm font-medium text-primary hover:underline"
          >
            See all
          </Link>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : transactions?.content.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
            <Link
              to="/transactions"
              className="text-primary text-sm hover:underline mt-1 inline-block"
            >
              Add your first transaction
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions?.content.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: tx.categoryColor
                      ? `${tx.categoryColor}20`
                      : 'var(--color-muted)',
                  }}
                >
                  <CategoryIcon
                    name={tx.categoryIcon}
                    className="h-5 w-5"
                    style={{ color: tx.categoryColor ?? 'var(--color-muted-foreground)' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {tx.description || tx.categoryName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.accountName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-semibold ${TRANSACTION_TYPE_COLORS[tx.type] ?? ''}`}
                  >
                    {tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT'
                      ? '- '
                      : '+ '}
                    {formatCurrency(tx.amount, tx.accountCurrency ?? 'USD')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.transactionDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
