import { useState } from 'react';
import type { DebtResponse, DebtRequest, DebtType } from '@/types';
import {
  useDebts,
  useCreateDebt,
  useUpdateDebt,
  useCloseDebt,
  useDeleteDebt,
} from '@/hooks/use-debts';
import { formatCurrency, formatDate, DEBT_STATUS_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, CheckCircle, HandCoins, Loader2 } from 'lucide-react';

const emptyForm: DebtRequest = {
  type: 'DEBT',
  personName: '',
  amount: 0,
  currency: 'USD',
  description: undefined,
  dueDate: undefined,
};

export default function DebtsPage() {
  const { data: debts, isLoading } = useDebts();
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const closeDebt = useCloseDebt();
  const deleteDebt = useDeleteDebt();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtResponse | null>(null);
  const [targetDebtId, setTargetDebtId] = useState<number | null>(null);
  const [form, setForm] = useState<DebtRequest>(emptyForm);

  const openDebts = debts?.filter((d) => d.status === 'OPEN') ?? [];
  const totalIOwe = openDebts
    .filter((d) => d.type === 'DEBT')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalOwedToMe = openDebts
    .filter((d) => d.type === 'RECEIVABLE')
    .reduce((sum, d) => sum + d.amount, 0);
  const netPosition = totalOwedToMe - totalIOwe;

  const debtsByType = (type: DebtType) =>
    debts?.filter((d) => d.type === type) ?? [];

  function openCreateDialog() {
    setEditingDebt(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(debt: DebtResponse) {
    setEditingDebt(debt);
    setForm({
      type: debt.type,
      personName: debt.personName,
      amount: debt.amount,
      currency: debt.currency,
      description: debt.description,
      dueDate: debt.dueDate,
    });
    setDialogOpen(true);
  }

  function openCloseDialog(id: number) {
    setTargetDebtId(id);
    setCloseDialogOpen(true);
  }

  function openDeleteDialog(id: number) {
    setTargetDebtId(id);
    setDeleteDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: DebtRequest = {
      ...form,
      description: form.description || undefined,
      dueDate: form.dueDate || undefined,
    };

    if (editingDebt) {
      updateDebt.mutate(
        { id: editingDebt.id, data: payload },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createDebt.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  }

  function handleClose() {
    if (targetDebtId === null) return;
    closeDebt.mutate(targetDebtId, {
      onSuccess: () => {
        setCloseDialogOpen(false);
        setTargetDebtId(null);
      },
    });
  }

  function handleDelete() {
    if (targetDebtId === null) return;
    deleteDebt.mutate(targetDebtId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setTargetDebtId(null);
      },
    });
  }

  const isMutating = createDebt.isPending || updateDebt.isPending;

  function renderDebtCard(debt: DebtResponse) {
    return (
      <Card key={debt.id}>
        <CardContent className="flex items-center justify-between py-4">
          <div className="space-y-1">
            <p className="font-medium">{debt.personName}</p>
            <p className="text-lg font-bold">
              {formatCurrency(debt.amount, debt.currency)}
            </p>
            {debt.description && (
              <p className="text-sm text-muted-foreground">
                {debt.description}
              </p>
            )}
            {debt.dueDate && (
              <p className="text-xs text-muted-foreground">
                Due: {formatDate(debt.dueDate)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge className={DEBT_STATUS_COLORS[debt.status]}>
              {debt.status}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(debt)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {debt.status === 'OPEN' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openCloseDialog(debt.id)}
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog(debt.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debts</h1>
          <p className="text-muted-foreground">
            Track money you owe and money owed to you.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Debt
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total I Owe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalIOwe)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Owed to Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalOwedToMe)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p
                className={`text-2xl font-bold ${netPosition >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {formatCurrency(Math.abs(netPosition))}
                {netPosition < 0 ? ' (owe)' : ' (owed)'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debt Tabs */}
      <Tabs defaultValue="owe">
        <TabsList>
          <TabsTrigger value="owe">I Owe</TabsTrigger>
          <TabsTrigger value="receivable">Owed to Me</TabsTrigger>
        </TabsList>

        <TabsContent value="owe">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : !debtsByType('DEBT').length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HandCoins className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No debts recorded
                </p>
                <p className="text-sm text-muted-foreground">
                  You don't owe anyone right now.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {debtsByType('DEBT').map(renderDebtCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="receivable">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : !debtsByType('RECEIVABLE').length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HandCoins className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No receivables recorded
                </p>
                <p className="text-sm text-muted-foreground">
                  Nobody owes you right now.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {debtsByType('RECEIVABLE').map(renderDebtCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDebt ? 'Edit Debt' : 'Add Debt'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({ ...form, type: v as DebtType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBT">I Owe (Debt)</SelectItem>
                  <SelectItem value="RECEIVABLE">
                    Owed to Me (Receivable)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personName">Person Name</Label>
              <Input
                id="personName"
                value={form.personName}
                onChange={(e) =>
                  setForm({ ...form, personName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount || ''}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
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
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={form.description ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dueDate: e.target.value || undefined,
                  })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingDebt ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Debt</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to mark this debt as closed?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleClose} disabled={closeDebt.isPending}>
              {closeDebt.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Close Debt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Debt</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this debt? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDebt.isPending}
            >
              {deleteDebt.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
