import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthLayout } from '@/components/layout/auth-layout';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LoginPage = lazy(() => import('@/pages/auth/login-page'));
const RegisterPage = lazy(() => import('@/pages/auth/register-page'));
const DashboardPage = lazy(() => import('@/pages/dashboard/dashboard-page'));
const AccountsPage = lazy(() => import('@/pages/accounts/accounts-page'));
const AccountDetailPage = lazy(() => import('@/pages/accounts/account-detail-page'));
const TransactionsPage = lazy(() => import('@/pages/transactions/transactions-page'));
const TransfersPage = lazy(() => import('@/pages/transfers/transfers-page'));
const BudgetsPage = lazy(() => import('@/pages/budgets/budgets-page'));
const DebtsPage = lazy(() => import('@/pages/debts/debts-page'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/analytics-page'));
const CalendarPage = lazy(() => import('@/pages/calendar/calendar-page'));
const FamilyPage = lazy(() => import('@/pages/family/family-page'));
const AiInsightsPage = lazy(() => import('@/pages/ai-insights/ai-insights-page'));
const NotificationsPage = lazy(() => import('@/pages/notifications/notifications-page'));
const CarsPage = lazy(() => import('@/pages/cars/cars-page'));
const HousesPage = lazy(() => import('@/pages/houses/houses-page'));
const SettingsPage = lazy(() => import('@/pages/settings/settings-page'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function PageLoader() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/accounts/:id" element={<AccountDetailPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/transfers" element={<TransfersPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/debts" element={<DebtsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/family" element={<FamilyPage />} />
                <Route path="/ai-insights" element={<AiInsightsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/cars" element={<CarsPage />} />
                <Route path="/houses" element={<HousesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
