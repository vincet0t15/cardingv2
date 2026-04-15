import { DatePicker } from '@/components/custom-date-picker';
import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Employee } from '@/types/employee';
import type { Salary } from '@/types/salary';
import { router, useForm } from '@inertiajs/react';
import { CalendarIcon, PencilIcon, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useEffect, useState, type FormEventHandler } from 'react';
import { toast } from 'sonner';

interface CompensationSalaryProps {
    employee: Employee;
    sourceOfFundCodes?: { id: number; code: string; description: string | null; status: boolean }[];
}

function AddSalaryDialog({
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
        effective_date: new Date().toISOString().split('T')[0],
        source_of_fund_code_id: null as number | null,
    });

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        post(route('salaries.store'), {
            onSuccess: () => {
                toast.success('Salary added successfully');
                reset();
                onClose();
            },
            onError: () => toast.error('Failed to add salary.'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Salary</DialogTitle>
                        <DialogDescription>Enter the new salary amount and effective date.</DialogDescription>
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
                            <DatePicker value={data.effective_date} onChange={(value) => setData('effective_date', value)} />
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
                            {processing ? 'Saving...' : 'Save Salary'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditSalaryDialog({
    open,
    onClose,
    salary,
    sourceOfFundCodes,
}: {
    open: boolean;
    onClose: () => void;
    salary: Salary | null;
    sourceOfFundCodes?: { id: number; code: string; description: string | null; status: boolean }[];
}) {
    const { data, setData, put, processing, reset } = useForm({
        amount: '',
        effective_date: '',
        source_of_fund_code_id: null as number | null,
    });

    // Update form data when salary changes
    useEffect(() => {
        if (salary) {
            setData({
                amount: salary.amount?.toString() || '',
                effective_date: salary.effective_date || '',
                source_of_fund_code_id: (salary as any).source_of_fund_code_id ?? null,
            });
        }
    }, [salary]);

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        if (!salary) return;

        put(route('salaries.update', salary.id), {
            onSuccess: () => {
                toast.success('Salary updated successfully');
                reset();
                onClose();
            },
            onError: () => toast.error('Failed to update salary.'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Salary</DialogTitle>
                        <DialogDescription>Update the salary amount and effective date.</DialogDescription>
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
                            {processing ? 'Saving...' : 'Update Salary'}
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

export function CompensationSalary({ employee, sourceOfFundCodes }: CompensationSalaryProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editDialog, setEditDialog] = useState<{ open: boolean; salary: Salary | null }>({
        open: false,
        salary: null,
    });
    const salaries: Salary[] = employee.salaries ?? [];
    const current = employee.latest_salary;

    const handleDelete = (salary: Salary) => {
        if (confirm('Are you sure you want to delete this salary record?')) {
            router.delete(route('salaries.destroy', salary.id), {
                onSuccess: () => toast.success('Salary record deleted successfully'),
                onError: () => toast.error('Failed to delete salary record'),
            });
        }
    };

    const handleEdit = (salary: Salary) => {
        setEditDialog({ open: true, salary });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-end">
                <Button onClick={() => setOpenDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add Salary
                </Button>
            </div>

            {/* Current Salary Card */}
            <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm dark:from-emerald-950/30 dark:to-teal-950/30">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Current Salary
                </div>
                {current ? (
                    <>
                        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(current.amount)}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <CalendarIcon className="h-3 w-3" />
                            Effective {formatDate(current.effective_date)}
                        </p>
                        {current.source_of_fund_code && (
                            <div className="mt-2 rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Fund: {current.source_of_fund_code.code}</p>
                                {current.source_of_fund_code.description && (
                                    <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">{current.source_of_fund_code.description}</p>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-muted-foreground text-sm">No salary record yet.</p>
                )}
            </div>

            {/* History Table */}
            <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">History</p>
                {salaries.length === 0 ? (
                    <div className="text-muted-foreground rounded-lg border py-8 text-center text-sm">No salary history.</div>
                ) : (
                    <div className="overflow-hidden rounded-lg border shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Source of Fund</TableHead>
                                    <TableHead>Effective Date</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {salaries.map((s, i) => (
                                    <TableRow key={s.id} className={i === 0 ? 'font-semibold' : ''}>
                                        <TableCell>{formatCurrency(s.amount)}</TableCell>
                                        <TableCell>
                                            {s.source_of_fund_code ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {s.source_of_fund_code.code}
                                                    </span>
                                                    {s.source_of_fund_code.description && (
                                                        <span className="text-muted-foreground text-xs">{s.source_of_fund_code.description}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Not Assigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{formatDate(s.effective_date)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(s)} className="h-8 w-8">
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(s)}
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

            {openDialog && (
                <AddSalaryDialog open={openDialog} onClose={() => setOpenDialog(false)} employee={employee} sourceOfFundCodes={sourceOfFundCodes} />
            )}
            {editDialog.open && editDialog.salary && (
                <EditSalaryDialog
                    open={editDialog.open}
                    onClose={() => setEditDialog({ open: false, salary: null })}
                    salary={editDialog.salary}
                    sourceOfFundCodes={sourceOfFundCodes}
                />
            )}
        </div>
    );
}
