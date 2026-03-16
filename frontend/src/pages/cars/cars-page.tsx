import { useState } from 'react';
import type { CarResponse, CarRequest, FineResponse } from '@/types';
import {
  useCars,
  useCreateCar,
  useDeleteCar,
  useCarFines,
  usePayFine,
} from '@/hooks/use-cars';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Car,
  Plus,
  Trash2,
  Eye,
  CreditCard,
  AlertTriangle,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const emptyForm: CarRequest = {
  licensePlate: '',
  registrationCertificate: undefined,
  nickname: undefined,
};

export default function CarsPage() {
  const { data: cars, isLoading } = useCars();
  const createCar = useCreateCar();
  const deleteCar = useDeleteCar();

  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetCarId, setTargetCarId] = useState<number | null>(null);
  const [payConfirmFineId, setPayConfirmFineId] = useState<number | null>(null);
  const [form, setForm] = useState<CarRequest>(emptyForm);

  const selectedCar = cars?.find((c) => c.id === selectedCarId) ?? null;

  function openAddDialog() {
    setForm(emptyForm);
    setAddDialogOpen(true);
  }

  function openDeleteDialog(id: number) {
    setTargetCarId(id);
    setDeleteDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CarRequest = {
      ...form,
      registrationCertificate: form.registrationCertificate || undefined,
      nickname: form.nickname || undefined,
    };
    createCar.mutate(payload, {
      onSuccess: () => setAddDialogOpen(false),
    });
  }

  function handleDelete() {
    if (targetCarId === null) return;
    deleteCar.mutate(targetCarId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setTargetCarId(null);
        if (selectedCarId === targetCarId) {
          setSelectedCarId(null);
        }
      },
    });
  }

  // Detail view
  if (selectedCar) {
    return (
      <CarDetailView
        car={selectedCar}
        payConfirmFineId={payConfirmFineId}
        setPayConfirmFineId={setPayConfirmFineId}
        onBack={() => {
          setSelectedCarId(null);
          setPayConfirmFineId(null);
        }}
      />
    );
  }

  // Main view - Cars list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Cars</h1>
            <p className="text-muted-foreground">
              Manage your vehicles and track fines.
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Car
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : !cars?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No cars yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first car to track fines
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Car
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.map((car) => (
            <Card key={car.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xl font-mono font-bold tracking-wider">
                      {car.licensePlate}
                    </p>
                    {car.nickname && (
                      <p className="text-sm text-muted-foreground">
                        {car.nickname}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      car.unpaidFinesCount > 0
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    )}
                  >
                    {car.unpaidFinesCount > 0 ? (
                      <>
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {car.unpaidFinesCount} unpaid
                      </>
                    ) : (
                      'No fines'
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {car.unpaidFinesCount > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Unpaid total: </span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(car.unpaidFinesTotal)}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedCarId(car.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Fines
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(car.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Car Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Car</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate *</Label>
              <Input
                id="licensePlate"
                placeholder="e.g. 01 A 123 BC"
                value={form.licensePlate}
                onChange={(e) =>
                  setForm({ ...form, licensePlate: e.target.value })
                }
                maxLength={20}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationCertificate">
                Registration Certificate
              </Label>
              <Input
                id="registrationCertificate"
                placeholder="Optional"
                value={form.registrationCertificate ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    registrationCertificate: e.target.value || undefined,
                  })
                }
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                placeholder="e.g. Family SUV"
                value={form.nickname ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nickname: e.target.value || undefined,
                  })
                }
                maxLength={100}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCar.isPending}>
                {createCar.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Car
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Car</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this car? All associated fine records
            will also be deleted. This action cannot be undone.
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
              disabled={deleteCar.isPending}
            >
              {deleteCar.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Detail sub-component ─── */

function CarDetailView({
  car,
  payConfirmFineId,
  setPayConfirmFineId,
  onBack,
}: {
  car: CarResponse;
  payConfirmFineId: number | null;
  setPayConfirmFineId: (id: number | null) => void;
  onBack: () => void;
}) {
  const { data: fines, isLoading } = useCarFines(car.id);
  const payFine = usePayFine(car.id);

  const fineBeingPaid = fines?.find((f) => f.id === payConfirmFineId);

  function handlePay() {
    if (payConfirmFineId === null) return;
    payFine.mutate(payConfirmFineId, {
      onSuccess: () => setPayConfirmFineId(null),
    });
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
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            {car.licensePlate}
          </h1>
          {car.nickname && (
            <p className="text-muted-foreground">{car.nickname}</p>
          )}
        </div>
        {car.unpaidFinesCount > 0 && (
          <Card className="px-4 py-2">
            <div className="text-sm text-muted-foreground">Unpaid Total</div>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(car.unpaidFinesTotal)}
            </div>
          </Card>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !fines?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No fines found for this car
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traffic Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Violation</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(fine.fineDate)}
                    </TableCell>
                    <TableCell>{fine.violationType}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(fine.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          fine.status === 'PAID'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-red-600 hover:bg-red-700'
                        )}
                      >
                        {fine.status === 'PAID' ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {fine.status === 'UNPAID' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPayConfirmFineId(fine.id)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {fine.paidAt ? formatDate(fine.paidAt) : '--'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pay Confirmation Dialog */}
      <Dialog
        open={payConfirmFineId !== null}
        onOpenChange={(open) => {
          if (!open) setPayConfirmFineId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to pay this fine of{' '}
            <span className="font-bold text-foreground">
              {fineBeingPaid ? formatCurrency(fineBeingPaid.amount) : ''}
            </span>
            ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayConfirmFineId(null)}
            >
              Cancel
            </Button>
            <Button onClick={handlePay} disabled={payFine.isPending}>
              {payFine.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
