import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccounts, useBalanceSummary, useCreateAccount } from '@/hooks/use-accounts';
import { formatCurrency } from '@/lib/constants';
import type { AccountType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  CreditCard,
  Banknote,
  Building2,
  PiggyBank,
  TrendingUp,
  Plus,
  Wallet,
  Loader2,
} from 'lucide-react';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: typeof CreditCard }[] = [
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'ACCOUNT', label: 'Account', icon: Building2 },
  { value: 'SAVINGS', label: 'Savings', icon: PiggyBank },
  { value: 'INVESTMENT', label: 'Investment', icon: TrendingUp },
];

const ACCOUNT_TYPE_ICON_MAP: Record<string, typeof CreditCard> = {
  CARD: CreditCard,
  CASH: Banknote,
  ACCOUNT: Building2,
  SAVINGS: PiggyBank,
  INVESTMENT: TrendingUp,
};

function getAccountIcon(type: string) {
  return ACCOUNT_TYPE_ICON_MAP[type] ?? Wallet;
}

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  type: z.enum(['CARD', 'CASH', 'ACCOUNT', 'SAVINGS', 'INVESTMENT'], {
    message: 'Account type is required',
  }),
  currency: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters'),
  initialBalance: z
    .union([z.coerce.number().min(0, 'Balance must be 0 or greater'), z.literal('')])
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : val)),
});

type AccountFormValues = z.input<typeof accountSchema>;

export default function AccountsPage() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: balanceSummary, isLoading: summaryLoading } = useBalanceSummary();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Balance Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Total Balance by Currency</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-32" />
              ))}
            </div>
          ) : balanceSummary && Object.keys(balanceSummary).length > 0 ? (
            <div className="flex flex-wrap gap-6">
              {Object.entries(balanceSummary).map(([currency, total]) => (
                <div key={currency}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {currency}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(total, currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Accounts</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={false}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Account</DialogTitle>
            </DialogHeader>
            <CreateAccountForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Cards Grid */}
      {accountsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : accounts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No accounts yet</p>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create your first account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts?.map((account) => {
            const Icon = getAccountIcon(account.type);
            return (
              <Link key={account.id} to={`/accounts/${account.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Badge variant="outline">{account.type}</Badge>
                    </div>
                    <p className="font-medium truncate">{account.name}</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {account.currency}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateAccountForm({ onSuccess }: { onSuccess: () => void }) {
  const createAccount = useCreateAccount();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: undefined,
      currency: 'USD',
      initialBalance: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = (data: AccountFormValues) => {
    const parsed = accountSchema.parse(data);
    createAccount.mutate(
      {
        name: parsed.name,
        type: parsed.type,
        currency: parsed.currency,
        initialBalance: parsed.initialBalance ?? undefined,
      },
      { onSuccess },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Account Name</Label>
        <Input
          id="name"
          placeholder="e.g. Main Checking"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Account Type</Label>
        <Select
          value={selectedType ?? ''}
          onValueChange={(val) => setValue('type', val as AccountType, { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((at) => {
              const Icon = at.icon;
              return (
                <SelectItem key={at.value} value={at.value}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {at.label}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={watch('currency') ?? 'USD'}
            onValueChange={(val) => setValue('currency', val, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="UZS">UZS (so'm)</SelectItem>
              <SelectItem value="RUB">RUB (₽)</SelectItem>
            </SelectContent>
          </Select>
          {errors.currency && (
            <p className="text-sm text-destructive">
              {errors.currency.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="initialBalance">Initial Balance</Label>
          <Input
            id="initialBalance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register('initialBalance')}
          />
          {errors.initialBalance && (
            <p className="text-sm text-destructive">
              {errors.initialBalance.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={createAccount.isPending}>
        {createAccount.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Create Account
      </Button>
    </form>
  );
}
