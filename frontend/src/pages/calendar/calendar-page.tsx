import { useState, useMemo } from 'react';
import { useCalendar } from '@/hooks/use-analytics';
import { useTransactions } from '@/hooks/use-transactions';
import { useRemindersByMonth, useCreateReminder, useDeleteReminder } from '@/hooks/use-reminders';
import { formatCurrency, TRANSACTION_TYPE_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryIcon } from '@/components/shared/category-icon';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  StickyNote,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: calendarData, isLoading } = useCalendar(year, month);
  const { data: monthReminders } = useRemindersByMonth(year, month);
  const createReminder = useCreateReminder();
  const deleteReminder = useDeleteReminder();

  // Reminder form state
  const [reminderDesc, setReminderDesc] = useState('');
  const [reminderAmount, setReminderAmount] = useState('');
  const [reminderCurrency, setReminderCurrency] = useState('USD');
  const [showReminderForm, setShowReminderForm] = useState(false);

  // Build a set of days that have reminders for calendar dot indicators
  const reminderDaysSet = useMemo(() => {
    const set = new Set<number>();
    if (monthReminders) {
      for (const r of monthReminders) {
        set.add(new Date(r.reminderDate + 'T00:00:00').getDate());
      }
    }
    return set;
  }, [monthReminders]);

  // Filter reminders for selected date
  const dayReminders = useMemo(() => {
    if (!selectedDate || !monthReminders) return [];
    return monthReminders.filter((r) => r.reminderDate === selectedDate);
  }, [selectedDate, monthReminders]);

  // Fetch transactions for the selected day
  const { data: dayTransactions } = useTransactions(
    selectedDate
      ? { dateFrom: selectedDate, dateTo: selectedDate, size: 50 }
      : { size: 0 },
  );

  const handleCreateReminder = () => {
    if (!selectedDate || !reminderDesc.trim()) return;
    createReminder.mutate(
      {
        description: reminderDesc.trim(),
        amount: reminderAmount ? Number(reminderAmount) : undefined,
        currency: reminderAmount ? reminderCurrency : undefined,
        reminderDate: selectedDate,
      },
      {
        onSuccess: () => {
          setReminderDesc('');
          setReminderAmount('');
          setShowReminderForm(false);
        },
      },
    );
  };

  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDate(null);
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1);
  // getDay() returns 0 for Sunday, we want Monday = 0
  const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const daysInMonth = new Date(year, month, 0).getDate();

  // Build day lookup from calendar data
  const dayDataMap = new Map<number, { income: number; expense: number; net: number }>();
  if (calendarData?.days) {
    for (const day of calendarData.days) {
      const dayNum = new Date(day.date).getDate();
      dayDataMap.set(dayNum, {
        income: day.income,
        expense: day.expense,
        net: day.net,
      });
    }
  }

  // Monthly totals
  let monthIncome = 0;
  let monthExpense = 0;
  if (calendarData?.days) {
    for (const day of calendarData.days) {
      monthIncome += day.income;
      monthExpense += day.expense;
    }
  }

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Daily income and expense tracking</p>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Month Income</p>
              {isLoading ? (
                <Skeleton className="h-6 w-24 mt-0.5" />
              ) : (
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(monthIncome)}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Month Expenses</p>
              {isLoading ? (
                <Skeleton className="h-6 w-24 mt-0.5" />
              ) : (
                <p className="text-lg font-bold text-red-500">{formatCurrency(monthExpense)}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net</p>
              {isLoading ? (
                <Skeleton className="h-6 w-24 mt-0.5" />
              ) : (
                <p className={cn('text-lg font-bold', monthIncome - monthExpense >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                  {formatCurrency(monthIncome - monthExpense)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">
                  {MONTH_NAMES[month - 1]} {year}
                </CardTitle>
                {!isCurrentMonth && (
                  <button
                    onClick={goToToday}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Today
                  </button>
                )}
              </div>
              <button
                onClick={goToNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayData = dayDataMap.get(dayNum);
                const hasIncome = dayData && dayData.income > 0;
                const hasExpense = dayData && dayData.expense > 0;
                const hasReminder = reminderDaysSet.has(dayNum);
                const isToday = isCurrentMonth && dayNum === today.getDate();
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dayNum}
                    onClick={() => {
                      setSelectedDate(isSelected ? null : dateStr);
                      setShowReminderForm(false);
                      setReminderDesc('');
                      setReminderAmount('');
                    }}
                    className={cn(
                      'aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm transition-colors relative',
                      isSelected
                        ? 'bg-primary/20 ring-1 ring-primary'
                        : 'hover:bg-white/10',
                      isToday && !isSelected && 'ring-1 ring-primary/50',
                    )}
                  >
                    <span className={cn(
                      'font-medium text-xs',
                      isToday && 'text-primary font-bold',
                    )}>
                      {dayNum}
                    </span>
                    <div className="flex gap-0.5">
                      {hasIncome && (
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {hasExpense && (
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      )}
                      {hasReminder && (
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span>Expense</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Reminder</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Detail Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select a day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Click on a day to see its transactions
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Day summary */}
                {(() => {
                  const dayNum = new Date(selectedDate + 'T00:00:00').getDate();
                  const dayData = dayDataMap.get(dayNum);
                  if (!dayData) return null;
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Income</p>
                        <p className="text-sm font-bold text-emerald-500">
                          {formatCurrency(dayData.income)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-red-500/10 p-3 text-center">
                        <p className="text-xs text-muted-foreground">Expense</p>
                        <p className="text-sm font-bold text-red-500">
                          {formatCurrency(dayData.expense)}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Transactions list */}
                <div className="space-y-1">
                  {!dayTransactions?.content?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No transactions on this day.
                    </p>
                  ) : (
                    dayTransactions.content.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: tx.categoryColor
                              ? `${tx.categoryColor}20`
                              : 'var(--color-muted)',
                          }}
                        >
                          <CategoryIcon
                            name={tx.categoryIcon}
                            className="h-4 w-4"
                            style={{ color: tx.categoryColor ?? 'var(--color-muted-foreground)' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {tx.description || tx.categoryName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{tx.accountName}</p>
                        </div>
                        <p className={cn('text-xs font-semibold', TRANSACTION_TYPE_COLORS[tx.type] ?? '')}>
                          {tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT' ? '- ' : '+ '}
                          {formatCurrency(tx.amount, tx.accountCurrency ?? 'USD')}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reminders section */}
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <StickyNote className="h-3.5 w-3.5 text-blue-500" />
                      Reminders
                    </p>
                    {!showReminderForm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowReminderForm(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>

                  {/* Reminder form */}
                  {showReminderForm && (
                    <div className="space-y-2 rounded-lg bg-blue-500/5 p-3">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          placeholder="e.g. Payment for car"
                          value={reminderDesc}
                          onChange={(e) => setReminderDesc(e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Amount (optional)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={reminderAmount}
                            onChange={(e) => setReminderAmount(e.target.value)}
                            className="h-8 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Currency</Label>
                          <Select
                            value={reminderCurrency}
                            onValueChange={setReminderCurrency}
                          >
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="UZS">UZS (so'm)</SelectItem>
                              <SelectItem value="RUB">RUB (₽)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={handleCreateReminder}
                          disabled={createReminder.isPending || !reminderDesc.trim()}
                        >
                          {createReminder.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setShowReminderForm(false);
                            setReminderDesc('');
                            setReminderAmount('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Reminder list */}
                  {dayReminders.length === 0 && !showReminderForm ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No reminders for this day.
                    </p>
                  ) : (
                    dayReminders.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-start gap-2 rounded-lg bg-blue-500/5 px-3 py-2"
                      >
                        <StickyNote className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{r.description}</p>
                          {r.amount != null && (
                            <p className="text-xs text-blue-400 font-semibold mt-0.5">
                              {formatCurrency(r.amount, r.currency ?? 'USD')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteReminder.mutate(r.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
