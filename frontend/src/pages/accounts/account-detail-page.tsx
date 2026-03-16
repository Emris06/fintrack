import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { formatCurrency, formatDate, TRANSACTION_TYPE_COLORS } from '@/lib/constants';
import type { AccountType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  Banknote,
  Building2,
  PiggyBank,
  TrendingUp,
  Wallet,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ACCOUNT_TYPE_ICON_MAP: Record<string, typeof CreditCard> = {
  CARD: CreditCard,
  CASH: Banknote,
  ACCOUNT: Building2,
  SAVINGS: PiggyBank,
  INVESTMENT: TrendingUp,
};

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'CARD', label: 'Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'INVESTMENT', label: 'Investment' },
];

function getAccountIcon(type: string) {
  return ACCOUNT_TYPE_ICON_MAP[type] ?? Wallet;
}

const editSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  type: z.enum(['CARD', 'CASH', 'ACCOUNT', 'SAVINGS', 'INVESTMENT'], {
    message: 'Account type is required',
  }),
  currency: z.string().length(3, 'Currency code must be exactly 3 characters'),
  initialBalance: z
    .union([z.coerce.number().min(0, 'Balance must be 0 or greater'), z.literal('')])
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : val)),
});

type EditFormValues = z.input<typeof editSchema>;

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const accountId = Number(id);

  const { data: account, isLoading: accountLoading } = useAccount(accountId);
  const deleteAccount = useDeleteAccount();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [page, setPage] = useState(0);

  const { data: transactions, isLoading: txLoading } = useTransactions({
    accountId,
    page,
    size: 10,
  });

  const handleDelete = () => {
    deleteAccount.mutate(accountId, {
      onSuccess: () => {
        setDeleteOpen(false);
        navigate('/accounts');
      },
    });
  };

  if (accountLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-muted-foreground">Account not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/accounts')}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  const Icon = getAccountIcon(account.type);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Account Header */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">{account.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{account.type}</Badge>
                <span className="text-sm text-muted-foreground">
                  {account.currency}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatCurrency(account.balance, account.currency)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Initial balance: {formatCurrency(account.initialBalance, account.currency)}
          </p>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transactions?.content.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No transactions for this account.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.content.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(tx.transactionDate)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tx.description || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          {tx.categoryColor && (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: tx.categoryColor }}
                            />
                          )}
                          {tx.categoryName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${TRANSACTION_TYPE_COLORS[tx.type] ?? ''}`}
                      >
                        {tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT'
                          ? '-'
                          : '+'}
                        {formatCurrency(tx.amount, account.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {transactions && transactions.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {transactions.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= transactions.totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <EditAccountForm
            account={account}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{account.name}</strong>? This
            action cannot be undone and all associated data will be removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending && (
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

function EditAccountForm({
  account,
  onSuccess,
}: {
  account: { id: number; name: string; type: AccountType; currency: string; initialBalance: number };
  onSuccess: () => void;
}) {
  const updateAccount = useUpdateAccount();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance,
    },
  });

  const selectedType = watch('type');

  const onSubmit = (data: EditFormValues) => {
    const parsed = editSchema.parse(data);
    updateAccount.mutate(
      {
        id: account.id,
        data: {
          name: parsed.name,
          type: parsed.type,
          currency: parsed.currency,
          initialBalance: parsed.initialBalance ?? undefined,
        },
      },
      { onSuccess },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Account Name</Label>
        <Input id="edit-name" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Account Type</Label>
        <Select
          value={selectedType ?? ''}
          onValueChange={(val) =>
            setValue('type', val as AccountType, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-currency">Currency</Label>
          <Input
            id="edit-currency"
            maxLength={3}
            {...register('currency')}
          />
          {errors.currency && (
            <p className="text-sm text-destructive">
              {errors.currency.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-balance">Initial Balance</Label>
          <Input
            id="edit-balance"
            type="number"
            step="0.01"
            min="0"
            {...register('initialBalance')}
          />
          {errors.initialBalance && (
            <p className="text-sm text-destructive">
              {errors.initialBalance.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={updateAccount.isPending}>
        {updateAccount.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Save Changes
      </Button>
    </form>
  );
}
