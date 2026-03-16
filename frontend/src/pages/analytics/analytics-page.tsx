import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell,
  BarChart, Bar,
  RadialBarChart, RadialBar,
} from 'recharts';
import {
  useAnalyticsSummary,
  useCategoryBreakdown,
  useTrend,
  useSavingsRate,
  useCategoryComparison,
} from '@/hooks/use-analytics';
import { formatCurrency } from '@/lib/constants';
import type { TrendGranularity } from '@/types';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/shared/date-picker';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
} from 'lucide-react';

function getFirstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function getLastDayOfMonth(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
}

const CHART_COLORS = [
  '#8b5cf6', '#f43f5e', '#10b981', '#6366f1', '#3b82f6',
  '#a855f7', '#ec4899', '#14b8a6', '#7c3aed', '#06b6d4',
  '#84cc16', '#c084fc',
];

const GRANULARITIES: { value: TrendGranularity; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const trendChartConfig = {
  income: { label: 'Income', color: '#22c55e' },
  expense: { label: 'Expenses', color: '#ef4444' },
} satisfies ChartConfig;

const comparisonChartConfig = {
  income: { label: 'Income', color: '#22c55e' },
  expense: { label: 'Expense', color: '#ef4444' },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(getFirstDayOfMonth);
  const [dateTo, setDateTo] = useState(getLastDayOfMonth);
  const [granularity, setGranularity] = useState<TrendGranularity>('MONTHLY');

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(dateFrom, dateTo);
  const { data: categoryBreakdown, isLoading: categoryLoading } = useCategoryBreakdown(dateFrom, dateTo);
  const { data: trendData, isLoading: trendLoading } = useTrend(dateFrom, dateTo, granularity);
  const { data: savingsRateData, isLoading: savingsLoading } = useSavingsRate(dateFrom, dateTo);
  const { data: categoryComparison, isLoading: comparisonLoading } = useCategoryComparison(dateFrom, dateTo);

  const savingsRate = savingsRateData?.savingsRate ?? summary?.savingsRate ?? 0;

  const categoryChartConfig = (categoryBreakdown ?? []).reduce<Record<string, { label: string; color: string }>>((acc, cat, idx) => {
    acc[cat.categoryName] = {
      label: cat.categoryName,
      color: cat.categoryColor ?? CHART_COLORS[idx % CHART_COLORS.length],
    };
    return acc;
  }, {}) satisfies ChartConfig;

  const savingsRadialConfig = {
    rate: { label: 'Savings Rate', color: savingsRate >= 0 ? '#22c55e' : '#ef4444' },
  } satisfies ChartConfig;

  const radialData = [
    { name: 'rate', value: Math.min(Math.max(Math.abs(savingsRate), 0), 100), fill: savingsRate >= 0 ? '#22c55e' : '#ef4444' },
  ];

  const formatTrendDate = (value: string) => {
    if (granularity === 'YEARLY') return value;
    if (granularity === 'MONTHLY') {
      const [y, m] = value.split('-');
      return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    const d = new Date(value);
    if (granularity === 'DAILY') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header with Date Range Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your income, expenses, and savings trends.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">From</span>
            <DatePicker value={dateFrom} onChange={setDateFrom} />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">To</span>
            <DatePicker value={dateTo} onChange={setDateTo} />
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Income"
          value={summary?.totalIncome}
          loading={summaryLoading}
          icon={TrendingUp}
          color="text-emerald-600"
          bgColor="bg-emerald-500/10"
        />
        <SummaryCard
          title="Total Expenses"
          value={summary?.totalExpenses}
          loading={summaryLoading}
          icon={TrendingDown}
          color="text-red-500"
          bgColor="bg-red-500/10"
        />
        <SummaryCard
          title="Net Savings"
          value={summary?.netResult}
          loading={summaryLoading}
          icon={DollarSign}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
              <Percent className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              {summaryLoading ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <p className="text-xl font-bold text-purple-400">
                  {(summary?.savingsRate ?? 0).toFixed(1)}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart - Full Width with Granularity Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Income vs Expenses Trend</CardTitle>
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {GRANULARITIES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGranularity(g.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    granularity === g.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : !trendData?.points?.length ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
              No trend data for this period.
            </div>
          ) : (
            <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
              <LineChart data={trendData.points}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTrendDate}
                  className="text-xs"
                />
                <YAxis
                  tickFormatter={(value: number) => formatCurrency(value).replace('.00', '')}
                  className="text-xs"
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="var(--color-income)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="var(--color-expense)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid: Category Breakdown + Category Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              </div>
            ) : !categoryBreakdown?.length ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No expense data for this period.
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ChartContainer config={categoryChartConfig} className="h-[300px] w-full max-w-[300px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={categoryBreakdown.map((cat, idx) => ({
                        name: cat.categoryName,
                        value: cat.amount,
                        fill: cat.categoryColor ?? CHART_COLORS[idx % CHART_COLORS.length],
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {categoryBreakdown.map((cat, idx) => (
                        <Cell
                          key={cat.categoryId}
                          fill={cat.categoryColor ?? CHART_COLORS[idx % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                <div className="flex-1 w-full space-y-2">
                  {categoryBreakdown.map((cat, idx) => (
                    <div key={cat.categoryId} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: cat.categoryColor ?? CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span className="truncate">{cat.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-medium">{formatCurrency(cat.amount)}</span>
                        <span className="text-muted-foreground w-12 text-right">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income vs Expense by Category (Bar Chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income vs Expense by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : !categoryComparison?.length ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No data for this period.
              </div>
            ) : (
              <ChartContainer config={comparisonChartConfig} className="h-[300px] w-full">
                <BarChart data={categoryComparison}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="categoryName"
                    className="text-xs"
                    tickFormatter={(value: string) => value.length > 10 ? value.slice(0, 10) + '...' : value}
                  />
                  <YAxis
                    tickFormatter={(value: number) => formatCurrency(value).replace('.00', '')}
                    className="text-xs"
                    width={80}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Savings Rate Radial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Savings Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {savingsLoading && summaryLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-12">
              <ChartContainer config={savingsRadialConfig} className="h-[200px] w-[200px]">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  barSize={14}
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    background
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ChartContainer>
              <div className="text-center sm:text-left">
                <p className="text-5xl font-bold" style={{ color: savingsRate >= 0 ? '#22c55e' : '#ef4444' }}>
                  {savingsRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {savingsRate >= 20
                    ? 'Great job! You are saving well.'
                    : savingsRate >= 0
                      ? 'Consider increasing your savings.'
                      : 'You are spending more than you earn.'}
                </p>
                {summary && (
                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    <p>Income: <span className="font-medium text-foreground">{formatCurrency(summary.totalIncome)}</span></p>
                    <p>Expenses: <span className="font-medium text-foreground">{formatCurrency(summary.totalExpenses)}</span></p>
                    <p>Saved: <span className="font-medium text-foreground">{formatCurrency(summary.netResult)}</span></p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  loading,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number | undefined;
  loading: boolean;
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${bgColor}`}
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-24 mt-1" />
          ) : (
            <p className={`text-xl font-bold ${color}`}>
              {formatCurrency(value ?? 0)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
