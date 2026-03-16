import { useState } from 'react';
import type {
  HouseResponse,
  HouseRequest,
  HouseServiceResponse,
  HouseServiceRequest,
  BillResponse,
  AccountResponse,
} from '@/types';
import {
  useHouses,
  useCreateHouse,
  useUpdateHouse,
  useDeleteHouse,
  useHouseServices,
  useCreateService,
  useDeleteService,
  useBills,
  useCreateBill,
  usePayBill,
} from '@/hooks/use-houses';
import { useAccounts } from '@/hooks/use-accounts';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Home,
  Plus,
  Trash2,
  Eye,
  CreditCard,
  ChevronLeft,
  Loader2,
  Zap,
  Flame,
  Wifi,
  Droplets,
  Tv,
  Shield,
  Trash,
  Building2,
  MoreHorizontal,
  MapPin,
  Pencil,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Service icon mapping ────────────────────────────────

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Electricity: Zap,
  Gas: Flame,
  Internet: Wifi,
  Water: Droplets,
  TV: Tv,
  Security: Shield,
  Garbage: Trash,
  'HOA / Communal': Building2,
};

function getServiceIcon(name: string) {
  for (const [key, Icon] of Object.entries(SERVICE_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return Icon;
  }
  return MoreHorizontal;
}

// ─── Empty forms ─────────────────────────────────────────

const emptyHouseForm: HouseRequest = { houseName: '', address: '' };

const emptyServiceForm: HouseServiceRequest = {
  serviceName: '',
  providerName: '',
  accountNumber: '',
  billingCycle: 'MONTHLY',
  averageAmount: undefined,
};

// ─── Main Page ───────────────────────────────────────────

export default function HousesPage() {
  const { data: houses, isLoading } = useHouses();
  const createHouse = useCreateHouse();
  const deleteHouse = useDeleteHouse();

  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetHouseId, setTargetHouseId] = useState<number | null>(null);
  const [form, setForm] = useState<HouseRequest>(emptyHouseForm);

  const updateHouse = useUpdateHouse();
  const selectedHouse = houses?.find((h) => h.id === selectedHouseId) ?? null;

  function openAdd() {
    setForm(emptyHouseForm);
    setAddDialogOpen(true);
  }

  function openEdit(house: HouseResponse) {
    setForm({ houseName: house.houseName, address: house.address ?? '' });
    setTargetHouseId(house.id);
    setEditDialogOpen(true);
  }

  function openDelete(id: number) {
    setTargetHouseId(id);
    setDeleteDialogOpen(true);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createHouse.mutate({ houseName: form.houseName, address: form.address || undefined }, {
      onSuccess: () => setAddDialogOpen(false),
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetHouseId) return;
    updateHouse.mutate({ id: targetHouseId, data: { houseName: form.houseName, address: form.address || undefined } }, {
      onSuccess: () => setEditDialogOpen(false),
    });
  }

  function handleDelete() {
    if (targetHouseId === null) return;
    deleteHouse.mutate(targetHouseId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        if (selectedHouseId === targetHouseId) setSelectedHouseId(null);
      },
    });
  }

  if (selectedHouse) {
    return (
      <HouseDetailView
        house={selectedHouse}
        onBack={() => setSelectedHouseId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Home className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Houses</h1>
            <p className="text-muted-foreground">Manage household utilities and bills.</p>
          </div>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add House
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
          ))}
        </div>
      ) : !houses?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No houses yet</p>
            <p className="text-sm text-muted-foreground mb-4">Add your first house to start tracking utilities</p>
            <Button onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add House
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {houses.map((house) => (
            <Card key={house.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{house.houseName}</CardTitle>
                    {house.address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {house.address}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      house.pendingBillsCount > 0
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    )}
                  >
                    {house.pendingBillsCount > 0
                      ? `${house.pendingBillsCount} pending`
                      : 'All paid'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Services</span>
                  <span className="font-medium">{house.servicesCount}</span>
                </div>
                {house.pendingBillsCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total due</span>
                    <span className="font-bold text-amber-500">
                      {formatCurrency(house.totalDue, 'UZS')}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedHouseId(house.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(house)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDelete(house.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add House Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add House</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="houseName">House Name *</Label>
              <Input
                id="houseName"
                placeholder='e.g. "My Apartment"'
                value={form.houseName}
                onChange={(e) => setForm({ ...form, houseName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Optional address"
                value={form.address ?? ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createHouse.isPending}>
                {createHouse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add House
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit House Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit House</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editHouseName">House Name *</Label>
              <Input
                id="editHouseName"
                value={form.houseName}
                onChange={(e) => setForm({ ...form, houseName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddress">Address</Label>
              <Input
                id="editAddress"
                value={form.address ?? ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateHouse.isPending}>
                {updateHouse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete House Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove House</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure? All services, bills, and payment records for this house will be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteHouse.isPending}>
              {deleteHouse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── House Detail View ───────────────────────────────────

function HouseDetailView({ house, onBack }: { house: HouseResponse; onBack: () => void }) {
  const { data: services, isLoading } = useHouseServices(house.id);
  const createService = useCreateService(house.id);
  const deleteService = useDeleteService(house.id);
  const payBill = usePayBill(house.id);
  const { data: accounts } = useAccounts();

  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState<HouseServiceRequest>(emptyServiceForm);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [payDialogBill, setPayDialogBill] = useState<BillResponse | null>(null);
  const [payAccountId, setPayAccountId] = useState<string>('');
  const [addBillServiceId, setAddBillServiceId] = useState<number | null>(null);

  const selectedService = services?.find((s) => s.id === selectedServiceId) ?? null;

  function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    createService.mutate(
      {
        serviceName: serviceForm.serviceName,
        providerName: serviceForm.providerName || undefined,
        accountNumber: serviceForm.accountNumber || undefined,
        billingCycle: serviceForm.billingCycle,
        averageAmount: serviceForm.averageAmount || undefined,
      },
      { onSuccess: () => { setAddServiceOpen(false); setServiceForm(emptyServiceForm); } },
    );
  }

  function handlePay() {
    if (!payDialogBill || !payAccountId) return;
    payBill.mutate(
      { billId: payDialogBill.id, data: { accountId: Number(payAccountId) } },
      { onSuccess: () => { setPayDialogBill(null); setPayAccountId(''); } },
    );
  }

  if (selectedService) {
    return (
      <ServiceBillsView
        house={house}
        service={selectedService}
        accounts={accounts ?? []}
        onBack={() => setSelectedServiceId(null)}
        onPay={(bill) => setPayDialogBill(bill)}
        addBillServiceId={addBillServiceId}
        setAddBillServiceId={setAddBillServiceId}
        payDialogBill={payDialogBill}
        payAccountId={payAccountId}
        setPayDialogBill={setPayDialogBill}
        setPayAccountId={setPayAccountId}
        payBill={payBill}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{house.houseName}</h1>
          {house.address && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {house.address}
            </p>
          )}
        </div>
        {house.pendingBillsCount > 0 && (
          <Card className="px-4 py-2">
            <div className="text-sm text-muted-foreground">Total Due</div>
            <div className="text-xl font-bold text-amber-500">
              {formatCurrency(house.totalDue, 'UZS')}
            </div>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Utility Services</h2>
        <Button size="sm" onClick={() => { setServiceForm(emptyServiceForm); setAddServiceOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !services?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No services added yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => {
            const Icon = getServiceIcon(svc.serviceName);
            return (
              <Card key={svc.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{svc.serviceName}</p>
                    {svc.providerName && (
                      <p className="text-sm text-muted-foreground truncate">{svc.providerName}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {svc.pendingBillsCount > 0 ? (
                      <>
                        <p className="font-bold text-amber-500">
                          {formatCurrency(svc.pendingAmount, 'UZS')}
                        </p>
                        <p className="text-xs text-muted-foreground">{svc.pendingBillsCount} due</p>
                      </>
                    ) : (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">Paid</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedServiceId(svc.id)}>
                      <Receipt className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteService.mutate(svc.id)}
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

      {/* Add Service Dialog */}
      <Dialog open={addServiceOpen} onOpenChange={setAddServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateService} className="space-y-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Select
                value={serviceForm.serviceName}
                onValueChange={(v) => setServiceForm({ ...serviceForm, serviceName: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {['Electricity', 'Gas', 'Water', 'Internet', 'TV', 'HOA / Communal', 'Garbage', 'Security', 'Other'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider Name</Label>
              <Input
                placeholder="e.g. Toshkent Elektr"
                value={serviceForm.providerName ?? ''}
                onChange={(e) => setServiceForm({ ...serviceForm, providerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                placeholder="Provider account number"
                value={serviceForm.accountNumber ?? ''}
                onChange={(e) => setServiceForm({ ...serviceForm, accountNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Average Monthly Amount</Label>
              <Input
                type="number"
                placeholder="0"
                value={serviceForm.averageAmount ?? ''}
                onChange={(e) => setServiceForm({ ...serviceForm, averageAmount: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddServiceOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createService.isPending || !serviceForm.serviceName}>
                {createService.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Service
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay Bill Dialog — shared across detail views */}
      <Dialog open={payDialogBill !== null} onOpenChange={(o) => { if (!o) { setPayDialogBill(null); setPayAccountId(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-lg font-bold">
                {payDialogBill ? formatCurrency(payDialogBill.amount, 'UZS') : ''}
              </span>
            </div>
            {payDialogBill?.description && (
              <p className="text-sm text-muted-foreground">{payDialogBill.description}</p>
            )}
            <div className="space-y-2">
              <Label>Pay from account *</Label>
              <Select value={payAccountId} onValueChange={setPayAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {(accounts ?? []).map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {acc.name} ({formatCurrency(acc.balance, acc.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayDialogBill(null); setPayAccountId(''); }}>Cancel</Button>
            <Button onClick={handlePay} disabled={payBill.isPending || !payAccountId}>
              {payBill.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Service Bills View ──────────────────────────────────

function ServiceBillsView({
  house,
  service,
  accounts,
  onBack,
  onPay,
  addBillServiceId,
  setAddBillServiceId,
  payDialogBill,
  payAccountId,
  setPayDialogBill,
  setPayAccountId,
  payBill,
}: {
  house: HouseResponse;
  service: HouseServiceResponse;
  accounts: AccountResponse[];
  onBack: () => void;
  onPay: (bill: BillResponse) => void;
  addBillServiceId: number | null;
  setAddBillServiceId: (id: number | null) => void;
  payDialogBill: BillResponse | null;
  payAccountId: string;
  setPayDialogBill: (bill: BillResponse | null) => void;
  setPayAccountId: (id: string) => void;
  payBill: ReturnType<typeof usePayBill>;
}) {
  const { data: bills, isLoading } = useBills(house.id, service.id);
  const createBill = useCreateBill(house.id, service.id);
  const [addBillOpen, setAddBillOpen] = useState(false);
  const [billForm, setBillForm] = useState({ amount: '', dueDate: '', description: '' });

  const Icon = getServiceIcon(service.serviceName);

  function handleCreateBill(e: React.FormEvent) {
    e.preventDefault();
    createBill.mutate(
      { amount: Number(billForm.amount), dueDate: billForm.dueDate, description: billForm.description || undefined },
      { onSuccess: () => { setAddBillOpen(false); setBillForm({ amount: '', dueDate: '', description: '' }); } },
    );
  }

  function handlePay() {
    if (!payDialogBill || !payAccountId) return;
    payBill.mutate(
      { billId: payDialogBill.id, data: { accountId: Number(payAccountId) } },
      { onSuccess: () => { setPayDialogBill(null); setPayAccountId(''); } },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to {house.houseName}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{service.serviceName}</h1>
            {service.providerName && <p className="text-muted-foreground">{service.providerName}</p>}
          </div>
        </div>
        <Button size="sm" onClick={() => setAddBillOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bill
        </Button>
      </div>

      {service.accountNumber && (
        <div className="text-sm text-muted-foreground">
          Account: <span className="font-mono text-foreground">{service.accountNumber}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !bills?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No bills yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="text-muted-foreground">{formatDate(bill.dueDate)}</TableCell>
                    <TableCell>{bill.description || '-'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(bill.amount, 'UZS')}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          bill.status === 'PAID'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        )}
                      >
                        {bill.status === 'PAID' ? 'Paid' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {bill.status === 'PENDING' ? (
                        <Button variant="outline" size="sm" onClick={() => setPayDialogBill(bill)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Bill Dialog */}
      <Dialog open={addBillOpen} onOpenChange={setAddBillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bill for {service.serviceName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBill} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                placeholder="0"
                value={billForm.amount}
                onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={billForm.dueDate}
                onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. March 2026 electricity"
                value={billForm.description}
                onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddBillOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createBill.isPending}>
                {createBill.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Bill
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay Bill Dialog */}
      <Dialog open={payDialogBill !== null} onOpenChange={(o) => { if (!o) { setPayDialogBill(null); setPayAccountId(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-lg font-bold">
                {payDialogBill ? formatCurrency(payDialogBill.amount, 'UZS') : ''}
              </span>
            </div>
            {payDialogBill?.description && (
              <p className="text-sm text-muted-foreground">{payDialogBill.description}</p>
            )}
            <div className="space-y-2">
              <Label>Pay from account *</Label>
              <Select value={payAccountId} onValueChange={setPayAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {acc.name} ({formatCurrency(acc.balance, acc.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayDialogBill(null); setPayAccountId(''); }}>Cancel</Button>
            <Button onClick={handlePay} disabled={payBill.isPending || !payAccountId}>
              {payBill.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
