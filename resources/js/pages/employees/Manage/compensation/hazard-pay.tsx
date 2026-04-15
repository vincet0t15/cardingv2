import { DatePicker } from '@/components/custom-date-picker';
import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Employee } from '@/types/employee';
import type { HazardPay } from '@/types/hazard-pay';
import { router, useForm } from '@inertiajs/react';
import { CalendarIcon, PencilIcon, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useEffect, useState, type FormEventHandler } from 'react';
import { toast } from 'sonner';

interface CompensationHazardPayProps {
    employee: Employee;
    sourceOfFundCodes?: { id: number; code: string; description: string | null; status: boolean }[];
}

function AddHazardPayDialog({
    open,
    onClose,
    employee,
    sourceOfFundCodes,
}: {
    open: boolean;
    onClose: () => void;
    employee: Employee;
    sourceOfFundCodes?: { id: number; code: string; description: string | null; status: boolean }[];
}) {
    const { data, setData, post, processing, reset } = useForm({
        employee_id: employee.id,
        amount: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '' as string | undefined,
        source_of_fund_code_id: null as number | null,
    });

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        post(route('hazard-pays.store'), {
            onSuccess: () => {
                toast.success('Hazard Pay added successfully');
                reset();
                onClose();
            },
            onError: () => toast.error('Failed to add Hazard Pay.'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Hazard Pay</DialogTitle>
                        <DialogDescription>Enter the hazard pay amount and date range.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                        <div className="flex flex-col gap-1">
                            <Label>Amount (₱)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <Label>Start Date</Label>
                                <DatePicker value={data.start_date} onChange={(value) => setData('start_date', value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label>End Date (Optional)</Label>
                                <DatePicker value={data.end_date} onChange={(value) => setData('end_date', value)} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label>Source of Fund Code (Optional)</Label>
                            <CustomComboBox
                                items={
                                    sourceOfFundCodes?.map((fund) => ({
                                        value: fund.id.toString(),
                                        label: `${fund.code} - ${fund.description || 'No description'}`,
                                    })) || []
                                }
                                placeholder="Select source of fund..."
                                value={data.source_of_fund_code_id?.toString() || null}
                                onSelect={(value) => setData('source_of_fund_code_id', value ? parseInt(value) : null)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Hazard Pay'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditHazardPayDialog({
    open,
    onClose,
    hazardPay,
    sourceOfFundCodes,
}: {
    open: boolean;
    onClose: () => void;
    hazardPay: HazardPay;
    sourceOfFundCodes?: { id: number; code: string; description: string | null; status: boolean }[];
}) {
    const { data, setData, put, processing, reset } = useForm({
        amount: String(hazardPay.amount),
        start_date: hazardPay.start_date,
        end_date: hazardPay.end_date || undefined,
        source_of_fund_code_id: hazardPay.source_of_fund_code?.id || (null as number | null),
    });

    useEffect(() => {
        reset();
    }, [hazardPay]);

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        put(route('hazard-pays.update', hazardPay.id), {
            onSuccess: () => {
                toast.success('Hazard Pay updated successfully');
                onClose();
            },
            onError: () => toast.error('Failed to update Hazard Pay.'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Hazard Pay</DialogTitle>
                        <DialogDescription>Update the hazard pay amount and date range.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                        <div className="flex flex-col gap-1">
                            <Label>Amount (₱)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <Label>Start Date</Label>
                                <DatePicker value={data.start_date} onChange={(value) => setData('start_date', value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label>End Date (Optional)</Label>
                                <DatePicker value={data.end_date} onChange={(value) => setData('end_date', value)} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label>Source of Fund Code (Optional)</Label>
                            <CustomComboBox
                                items={
                                    sourceOfFundCodes?.map((fund) => ({
                                        value: fund.id.toString(),
                                        label: `${fund.code} - ${fund.description || 'No description'}`,
                                    })) || []
                                }
                                placeholder="Select source of fund..."
                                value={data.source_of_fund_code_id?.toString() || null}
                                onSelect={(value) => setData('source_of_fund_code_id', value ? parseInt(value) : null)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update Hazard Pay'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '₱0.00';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
};

const formatDate = (date: string) => new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

export function CompensationHazardPay({ employee, sourceOfFundCodes }: CompensationHazardPayProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editDialog, setEditDialog] = useState<{ open: boolean; hazardPay: HazardPay | null }>({
        open: false,
        hazardPay: null,
    });
    const hazardPays: HazardPay[] = employee.hazard_pays ?? [];
    const current = employee.latest_hazard_pay;

    const handleDelete = (hazardPay: HazardPay) => {
        if (confirm('Are you sure you want to delete this hazard pay record?')) {
            router.delete(route('hazard-pays.destroy', hazardPay.id), {
                onSuccess: () => toast.success('Hazard Pay record deleted successfully'),
                onError: () => toast.error('Failed to delete hazard pay record'),
            });
        }
    };

    const handleEdit = (hazardPay: HazardPay) => {
        setEditDialog({ open: true, hazardPay });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-end">
                <Button onClick={() => setOpenDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add Hazard Pay
                </Button>
            </div>

            {/* Current Hazard Pay */}
            {current && (
                <div className="overflow-hidden rounded-lg border bg-gradient-to-br from-orange-50 to-white shadow-sm">
                    <div className="border-b bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                        <div className="flex items-center gap-2 text-white">
                            <TrendingUp className="h-5 w-5" />
                            <h3 className="text-sm font-semibold tracking-wide uppercase">Current Hazard Pay</h3>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        <div className="flex items-baseline justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs">Active Period</p>
                                <p className="mt-1 font-medium text-slate-900">
                                    {formatDate(current.start_date)}
                                    {current.end_date ? ` - ${formatDate(current.end_date)}` : ' - Present'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-muted-foreground text-xs">Amount</p>
                                <p className="text-3xl font-bold text-orange-600">{formatCurrency(current.amount)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History */}
            {hazardPays.length > 0 ? (
                <div className="overflow-hidden rounded-lg border shadow-sm">
                    <div className="border-b bg-slate-50 px-6 py-4">
                        <h3 className="text-sm font-semibold">Hazard Pay History</h3>
                    </div>
                    <div className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-semibold">Amount</TableHead>
                                    <TableHead className="font-semibold">Date Range</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hazardPays.map((hp, i) => (
                                    <TableRow key={hp.id} className={i === 0 ? 'font-semibold' : ''}>
                                        <TableCell>{formatCurrency(hp.amount)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(hp.start_date)}
                                            {hp.end_date ? ` - ${formatDate(hp.end_date)}` : ' - Present'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(hp)} className="h-8 w-8">
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(hp)}
                                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                <div className="text-muted-foreground rounded-lg border py-10 text-center">
                    <CalendarIcon className="mx-auto mb-2 h-10 w-10 opacity-20" />
                    <p className="text-sm">No hazard pay records yet.</p>
                </div>
            )}

            {openDialog && (
                <AddHazardPayDialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    employee={employee}
                    sourceOfFundCodes={sourceOfFundCodes}
                />
            )}
            {editDialog.open && editDialog.hazardPay && (
                <EditHazardPayDialog
                    open={editDialog.open}
                    onClose={() => setEditDialog({ open: false, hazardPay: null })}
                    hazardPay={editDialog.hazardPay}
                    sourceOfFundCodes={sourceOfFundCodes}
                />
            )}
        </div>
    );
}

export default CompensationHazardPay;
