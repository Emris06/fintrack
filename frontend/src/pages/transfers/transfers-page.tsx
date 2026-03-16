import { useState, useMemo, useRef } from 'react';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransfers, useCreateTransfer } from '@/hooks/use-transfers';
import { formatCurrency, formatDate } from '@/lib/constants';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Loader2 } from 'lucide-react';

const PAGE_SIZE = 20;

export default function TransfersPage() {
  // ---- Form state ----
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split('T')[0],
  );

  // Idempotency key generated once on mount
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const { data: accounts } = useAccounts();
  const createMutation = useCreateTransfer();

  // Filter target accounts to exclude selected source
  const targetAccounts = useMemo(() => {
    if (!accounts) return [];
    if (!sourceAccountId) return accounts;
    return accounts.filter((a) => String(a.id) !== sourceAccountId);
  }, [accounts, sourceAccountId]);

  const resetForm = () => {
    setSourceAccountId('');
    setTargetAccountId('');
    setAmount('');
    setDescription('');
    setTransferDate(new Date().toISOString().split('T')[0]);
    idempotencyKeyRef.current = crypto.randomUUID();
  };

  const handleSubmit = () => {
    if (!sourceAccountId || !targetAccountId || !amount) return;
    createMutation.mutate(
      {
        sourceAccountId: Number(sourceAccountId),
        targetAccountId: Number(targetAccountId),
        amount: Number(amount),
        description: description || undefined,
        idempotencyKey: idempotencyKeyRef.current,
        transferDate,
      },
      { onSuccess: resetForm },
    );
  };

  // ---- Transfer history ----
  const [page, setPage] = useState(0);
  const { data: transferPage, isLoading: transfersLoading } = useTransfers(
    page,
    PAGE_SIZE,
  );
  const totalPages = transferPage?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transfers</h1>
        <p className="text-muted-foreground">
          Move money between your accounts
        </p>
      </div>

      {/* Create Transfer Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Source account */}
            <div className="space-y-2">
              <Label>From Account</Label>
              <Select
                value={sourceAccountId}
                onValueChange={(val) => {
                  setSourceAccountId(val);
                  // Reset target if it matches the new source
                  if (val === targetAccountId) setTargetAccountId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} ({a.currency}) — {formatCurrency(a.balance, a.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourceAccountId && accounts && (() => {
                const acc = accounts.find((a) => String(a.id) === sourceAccountId);
                if (!acc) return null;
                return (
                  <p className="text-xs text-muted-foreground">
                    Balance: <span className="font-semibold text-foreground">{formatCurrency(acc.balance, acc.currency)}</span>
                  </p>
                );
              })()}
            </div>

            {/* Target account */}
            <div className="space-y-2">
              <Label>To Account</Label>
              <Select
                value={targetAccountId}
                onValueChange={setTargetAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {targetAccounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} ({a.currency}) — {formatCurrency(a.balance, a.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetAccountId && accounts && (() => {
                const acc = accounts.find((a) => String(a.id) === targetAccountId);
                if (!acc) return null;
                return (
                  <p className="text-xs text-muted-foreground">
                    Balance: <span className="font-semibold text-foreground">{formatCurrency(acc.balance, acc.currency)}</span>
                  </p>
                );
              })()}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </div>

            {/* Description (full width) */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="e.g. Monthly savings contribution"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="sm:col-span-2">
              <Button
                onClick={handleSubmit}
                disabled={
                  createMutation.isPending ||
                  !sourceAccountId ||
                  !targetAccountId ||
                  !amount
                }
                className="w-full sm:w-auto"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Transfer
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          {transfersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transferPage && transferPage.content.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead />
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferPage.content.map((t) => {
                    const isCrossCurrency =
                      t.sourceCurrency !== t.targetCurrency;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.sourceAccountName}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">
                          {t.targetAccountName}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-semibold tabular-nums text-purple-400">
                              -{formatCurrency(t.sourceAmount, t.sourceCurrency)}
                            </span>
                            <span className="font-semibold tabular-nums text-emerald-600">
                              +{formatCurrency(t.targetAmount, t.targetCurrency)}
                            </span>
                            {isCrossCurrency && (
                              <span className="text-xs text-muted-foreground">
                                Rate: {t.exchangeRate.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(t.transferDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

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
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg font-medium">No transfers yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first transfer using the form above
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
