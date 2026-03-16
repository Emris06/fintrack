import { useState, useEffect, useMemo } from 'react';
import type { TransactionType, TransactionFilters } from '@/types';
import { useTransactions, useCreateTransaction } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { usePredictCategory } from '@/hooks/use-ai';
import { formatCurrency, formatDate, TRANSACTION_TYPE_COLORS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  // ---- Filter state ----
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);

  const filters: TransactionFilters = useMemo(() => {
    const f: TransactionFilters = { page, size: PAGE_SIZE };
    if (typeFilter && typeFilter !== 'ALL') f.type = typeFilter as TransactionType;
    if (accountFilter) f.accountId = Number(accountFilter);
    if (categoryFilter) f.categoryId = Number(categoryFilter);
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    return f;
  }, [typeFilter, accountFilter, categoryFilter, dateFrom, dateTo, page]);

  const { data: txPage, isLoading: txLoading } = useTransactions(filters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  // ---- Dialog state ----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [formAccountId, setFormAccountId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  // ---- AI category prediction ----
  const [debouncedDesc, setDebouncedDesc] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedDesc(formDescription), 300);
    return () => clearTimeout(t);
  }, [formDescription]);
  const { data: predictedCategory } = usePredictCategory(debouncedDesc);

  const filteredFormCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(
      (c) => c.type === 'BOTH' || c.type === formType,
    );
  }, [categories, formType]);

  const createMutation = useCreateTransaction();

  const resetForm = () => {
    setFormType('EXPENSE');
    setFormAccountId('');
    setFormCategoryId('');
    setFormAmount('');
    setFormDescription('');
    setFormNote('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setDebouncedDesc('');
  };

  const handleCreate = () => {
    if (!formAccountId || !formCategoryId || !formAmount) return;
    createMutation.mutate(
      {
        accountId: Number(formAccountId),
        categoryId: Number(formCategoryId),
        type: formType,
        amount: Number(formAmount),
        description: formDescription || undefined,
        note: formNote || undefined,
        transactionDate: formDate,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      },
    );
  };

  // ---- Helpers ----
  const getTypeIcon = (type: TransactionType) => {
    if (type === 'INCOME' || type === 'TRANSFER_IN')
      return <ArrowDownLeft className="h-4 w-4" />;
    return <ArrowUpRight className="h-4 w-4" />;
  };

  const totalPages = txPage?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage and track your income and expenses
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Type toggle */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <ToggleGroup
                type="single"
                value={typeFilter}
                onValueChange={(val) => {
                  if (val) {
                    setTypeFilter(val);
                    setPage(0);
                  }
                }}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="ALL">All</ToggleGroupItem>
                <ToggleGroupItem value="INCOME">Income</ToggleGroupItem>
                <ToggleGroupItem value="EXPENSE">Expense</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Account filter */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Account</Label>
              <Select
                value={accountFilter}
                onValueChange={(val) => {
                  setAccountFilter(val === '__all__' ? '' : val);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All accounts</SelectItem>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category filter */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val === '__all__' ? '' : val);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="w-[160px]"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="w-[160px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardContent className="pt-6">
          {txLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : txPage && txPage.content.length > 0 ? (
            <div className="space-y-2">
              {txPage.content.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  {/* Category dot */}
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tx.categoryColor ?? '#6b7280' }}
                  />

                  {/* Category & description */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{tx.categoryName}</p>
                    {tx.description && (
                      <p className="truncate text-sm text-muted-foreground">
                        {tx.description}
                      </p>
                    )}
                  </div>

                  {/* Account */}
                  <Badge variant="outline" className="shrink-0">
                    {tx.accountName}
                  </Badge>

                  {/* Amount */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={TRANSACTION_TYPE_COLORS[tx.type]}>
                      {getTypeIcon(tx.type)}
                    </span>
                    <span
                      className={`font-semibold tabular-nums ${TRANSACTION_TYPE_COLORS[tx.type]}`}
                    >
                      {tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT'
                        ? '-'
                        : '+'}
                      {formatCurrency(tx.amount, tx.accountCurrency ?? 'USD')}
                    </span>
                  </div>

                  {/* Date */}
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {formatDate(tx.transactionDate)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or add a new transaction
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className={
                        page === 0
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={i === page}
                        onClick={() => setPage(i)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      className={
                        page === totalPages - 1
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Type toggle */}
            <div className="space-y-2">
              <Label>Type</Label>
              <ToggleGroup
                type="single"
                value={formType}
                onValueChange={(val) => {
                  if (val === 'INCOME' || val === 'EXPENSE') {
                    setFormType(val);
                    setFormCategoryId('');
                  }
                }}
                className="w-full"
              >
                <ToggleGroupItem value="INCOME" className="flex-1">
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Income
                </ToggleGroupItem>
                <ToggleGroupItem value="EXPENSE" className="flex-1">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Expense
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Account */}
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={formAccountId} onValueChange={setFormAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredFormCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color ?? '#6b7280' }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AI predicted category chip */}
              {predictedCategory &&
                String(predictedCategory.id) !== formCategoryId && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormCategoryId(String(predictedCategory.id))
                    }
                    className="mt-1"
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                    >
                      Suggested: {predictedCategory.name}
                    </Badge>
                  </button>
                )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Grocery shopping"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Note</Label>
              <textarea
                placeholder="Optional note..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            {/* Submit */}
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={
                createMutation.isPending ||
                !formAccountId ||
                !formCategoryId ||
                !formAmount
              }
            >
              {createMutation.isPending ? 'Creating...' : 'Create Transaction'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
