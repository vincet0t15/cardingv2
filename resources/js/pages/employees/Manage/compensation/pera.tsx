import { DatePicker } from '@/components/custom-date-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/standard-table';
import type { Employee } from '@/types/employee';
import type { Pera } from '@/types/pera';
import { router, useForm } from '@inertiajs/react';
import { CalendarIcon, PencilIcon, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useEffect, useState, type FormEventHandler } from 'react';
import { toast } from 'sonner';

interface CompensationPeraProps {
    employee: Employee;
}

function AddPeraDialog({ open, onClose, employee }: { open: boolean; onClose: () => void; employee: Employee }) {
    const { data, setData, post, processing, reset } = useForm({
        employee_id: employee.id,
        amount: '',
        effective_date: new Date().toISOString().split('T')[0],
    });

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        post(route('peras.store'), {
            onSuccess: () => {
                toast.success('PERA added successfully');
                reset();
                onClose();
            },
            onError: () => toast.error('Failed to add PERA.'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add PERA</DialogTitle>
                        <DialogDescription>Enter the PERA amount and effective date.</DialogDescription>
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
                        <div className="flex flex-col gap-1">
                            <Label>Effective Date</Label>
                            <DatePicker value={data.effective_date} onChange={(value: string) => setData('effective_date', value)} />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save PERA'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditPeraDialog({ open, onClose, pera }: { open: boolean; onClose: () => void; pera: Pera | null }) {
    const { data, setData, put, processing, reset } = useForm({
        amount: '',
        effective_date: '',
    });

    // Update form data when pera changes
    useEffect(() => {
        if (pera) {
            setData({
                amount: pera.amount?.toString() || '',
                effective_date: pera.effective_date || '',
            });
        }
    }, [pera]);

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        if (!pera) return;

        put(route('peras.update', pera.id), {
            onSuccess: () => {
                toast.success('PERA updated successfully');
                reset();
                onClose();
            },
            onError: () => toast.error('Failed to update PERA.'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit PERA</DialogTitle>
                        <DialogDescription>Update the PERA amount and effective date.</DialogDescription>
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
                        <div className="flex flex-col gap-1">
                            <Label>Effective Date</Label>
                            <DatePicker value={data.effective_date} onChange={(value: string) => setData('effective_date', value)} />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update PERA'}
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

const formatDate = (date?: string | null) => {
    if (!date) return '\u2014';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    const day = d.getDate();
    const monthShort = d.toLocaleString('en-PH', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${monthShort} ${year}`;
};

export default function CompensationPera({ employee }: CompensationPeraProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editDialog, setEditDialog] = useState<{ open: boolean; pera: Pera | null }>({
        open: false,
        pera: null,
    });
    const peras: Pera[] = employee.peras ?? [];
    const current = employee.latest_pera;

    const handleDelete = (pera: Pera) => {
        if (confirm('Are you sure you want to delete this PERA record?')) {
            router.delete(route('peras.destroy', pera.id), {
                onSuccess: () => toast.success('PERA record deleted successfully'),
                onError: () => toast.error('Failed to delete PERA record'),
            });
        }
    };

    const handleEdit = (pera: Pera) => {
        setEditDialog({ open: true, pera });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-end">
                <Button onClick={() => setOpenDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add PERA
                </Button>
            </div>

            {/* Current PERA Card */}
            <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-blue-700 uppercase dark:text-blue-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Current PERA
                </div>
                {current ? (
                    <>
                        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(current.amount)}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <CalendarIcon className="h-3 w-3" />
                            Effective {formatDate(current.effective_date)}
                        </p>
                    </>
                ) : (
                    <p className="text-muted-foreground text-sm">No PERA record yet.</p>
                )}
            </div>

            {/* History Table */}
            <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">History</p>
                {peras.length === 0 ? (
                    <div className="text-muted-foreground rounded-lg border py-8 text-center text-sm">No PERA history.</div>
                ) : (
                    <div className="overflow-hidden rounded-lg border shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Effective Date</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {peras.map((p, i) => (
                                    <TableRow key={p.id} className={i === 0 ? 'font-semibold' : ''}>
                                        <TableCell>{formatCurrency(p.amount)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{formatDate(p.effective_date)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-8 w-8">
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(p)}
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
                )}
            </div>

            {openDialog && <AddPeraDialog open={openDialog} onClose={() => setOpenDialog(false)} employee={employee} />}
            {editDialog.open && editDialog.pera && (
                <EditPeraDialog open={editDialog.open} onClose={() => setEditDialog({ open: false, pera: null })} pera={editDialog.pera} />
            )}
        </div>
    );
}
