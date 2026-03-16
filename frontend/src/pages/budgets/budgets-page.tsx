import { useState } from 'react';
import type { BudgetResponse, BudgetRequest, BudgetPeriod } from '@/types';
import {
  useBudgets,
  useBudgetPerformance,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-categories';
import { formatCurrency } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Target, Loader2 } from 'lucide-react';

const PERIOD_OPTIONS: BudgetPeriod[] = ['WEEKLY', 'MONTHLY', 'YEARLY'];

function getProgressColor(percentUsed: number): string {
  if (percentUsed < 50) return 'bg-emerald-500';
  if (percentUsed <= 80) return 'bg-purple-500';
  return 'bg-red-500';
}

const emptyForm: BudgetRequest = {
  name: '',
  categoryId: 0,
  amountLimit: 0,
  currency: 'USD',
  periodType: 'MONTHLY',
  startDate: new Date().toISOString().split('T')[0],
  endDate: undefined,
};

export default function BudgetsPage() {
  const { data: budgets, isLoading } = useBudgets();
  const { data: performance, isLoading: isLoadingPerformance } = useBudgetPerformance();
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetResponse | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<number | null>(null);
  const [form, setForm] = useState<BudgetRequest>(emptyForm);

  const expenseCategories = categories?.filter(
    (c) => c.type === 'EXPENSE' || c.type === 'BOTH',
  );

  function openCreateDialog() {
    setEditingBudget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(budget: BudgetResponse) {
    setEditingBudget(budget);
    setForm({
      name: budget.name,
      categoryId: budget.categoryId,
      amountLimit: budget.amountLimit,
      currency: budget.currency,
      periodType: budget.periodType,
      startDate: budget.startDate,
      endDate: budget.endDate,
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(id: number) {
    setDeletingBudgetId(id);
    setDeleteDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: BudgetRequest = {
      ...form,
      endDate: form.endDate || undefined,
    };

    if (editingBudget) {
      updateBudget.mutate(
        { id: editingBudget.id, data: payload },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createBudget.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  }

  function handleDelete() {
    if (deletingBudgetId === null) return;
    deleteBudget.mutate(deletingBudgetId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingBudgetId(null);
      },
    });
  }

  const isMutating = createBudget.isPending || updateBudget.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Manage your budgets and track spending limits.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      <Tabs defaultValue="budgets">
        <TabsList>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Tab 1: Budget Cards */}
        <TabsContent value="budgets">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : !budgets?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No budgets yet
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first budget to start tracking spending.
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => {
                const colorClass = getProgressColor(budget.percentUsed);
                return (
                  <Card key={budget.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {budget.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {budget.categoryName}
                          </p>
                        </div>
                        <Badge variant="outline">{budget.periodType}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="relative">
                        <Progress
                          value={Math.min(budget.percentUsed, 100)}
                          className="h-3"
                        />
                        <div
                          className={`absolute inset-y-0 left-0 h-3 rounded-full transition-all ${colorClass}`}
                          style={{
                            width: `${Math.min(budget.percentUsed, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {formatCurrency(budget.spent, budget.currency)} /{' '}
                          {formatCurrency(budget.amountLimit, budget.currency)}
                        </span>
                        <span className="font-medium">
                          {budget.percentUsed.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(budget.remaining, budget.currency)}{' '}
                        remaining
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(budget)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(budget.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Performance */}
        <TabsContent value="performance">
          {isLoadingPerformance ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !performance?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No performance data
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {performance.map((budget) => {
                const colorClass = getProgressColor(budget.percentUsed);
                return (
                  <Card key={budget.id}>
                    <CardContent className="flex items-center gap-6 py-4">
                      <div className="min-w-[140px]">
                        <p className="font-medium">{budget.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {budget.categoryName}
                        </p>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="relative">
                          <Progress
                            value={Math.min(budget.percentUsed, 100)}
                            className="h-3"
                          />
                          <div
                            className={`absolute inset-y-0 left-0 h-3 rounded-full transition-all ${colorClass}`}
                            style={{
                              width: `${Math.min(budget.percentUsed, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="min-w-[180px] text-right text-sm">
                        <span className="font-medium">
                          {formatCurrency(budget.spent, budget.currency)}
                        </span>
                        <span className="text-muted-foreground">
                          {' '}
                          / {formatCurrency(budget.amountLimit, budget.currency)}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          budget.percentUsed > 80
                            ? 'border-red-300 text-red-600'
                            : budget.percentUsed > 50
                              ? 'border-purple-300 text-purple-400'
                              : 'border-emerald-300 text-emerald-600'
                        }
                      >
                        {budget.percentUsed.toFixed(1)}%
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? 'Edit Budget' : 'Add Budget'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.categoryId ? String(form.categoryId) : ''}
                onValueChange={(v) =>
                  setForm({ ...form, categoryId: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories?.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountLimit">Amount Limit</Label>
                <Input
                  id="amountLimit"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amountLimit || ''}
                  onChange={(e) =>
                    setForm({ ...form, amountLimit: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="flex h-9 w-full rounded-md border border-white/10 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  required
                >
                  <option value="USD">USD ($)</option>
                  <option value="UZS">UZS (so'm)</option>
                  <option value="RUB">RUB (₽)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodType">Period</Label>
              <Select
                value={form.periodType}
                onValueChange={(v) =>
                  setForm({ ...form, periodType: v as BudgetPeriod })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      endDate: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBudget ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this budget? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBudget.isPending}
            >
              {deleteBudget.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
