import { CustomComboBox } from '@/components/CustomComboBox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Employee } from '@/types/employee';
import { Link, router } from '@inertiajs/react';
import { Pencil, Plus, RefreshCcw, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface AdjustmentType {
    id: number;
    name: string;
}

interface Adjustment {
    id: number;
    employee_id: number;
    adjustment_type: string | AdjustmentType;
    adjustment_type_id?: number;
    adjustmentType?: AdjustmentType;
    amount: number;
    pay_period_month: number;
    pay_period_year: number;
    effectivity_date: string;
    reference_id?: string;
    reference_type?: string;
    status: 'pending' | 'approved' | 'rejected' | 'processed';
    reason: string;
    remarks?: string;
    approved_by?: number;
    approved_at?: string;
    processed_at?: string;
    processed_by?: string;
    created_at: string;
    updated_at: string;
}

interface EmployeeAdjustmentsProps {
    employee: Employee;
    adjustments: Adjustment[];
    statistics: {
        total_pending: number;
        total_approved: number;
        total_processed: number;
        total_rejected: number;
        total_amount: number;
    };
}

export default function EmployeeAdjustments({ employee, adjustments, statistics }: EmployeeAdjustmentsProps) {
    const [filterMonth, setFilterMonth] = useState<string | null>(null);
    const [filterYear, setFilterYear] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Extract available years from adjustments
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        adjustments.forEach((a) => years.add(a.pay_period_year));
        return Array.from(years).sort((a, b) => b - a);
    }, [adjustments]);

    // Filter adjustments by month and year
    const filteredAdjustments = useMemo(() => {
        return adjustments.filter((a) => {
            const monthMatch = !filterMonth || a.pay_period_month === parseInt(filterMonth);
            const yearMatch = !filterYear || a.pay_period_year === parseInt(filterYear);
            return monthMatch && yearMatch;
        });
    }, [adjustments, filterMonth, filterYear]);

    const hasActiveFilters = filterMonth || filterYear;

    const clearFilters = () => {
        setFilterMonth(null);
        setFilterYear(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleEditAdjustment = (adjustment: Adjustment) => {
        router.get(route('adjustments.edit', adjustment.id));
    };

    const handleDeleteAdjustment = async (adjustment: Adjustment) => {
        setSelectedAdjustment(adjustment);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedAdjustment) return;
        setIsDeleting(true);
        router.delete(route('adjustments.destroy', selectedAdjustment.id), {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                setSelectedAdjustment(null);
            },
        });
    };

    const getTypeBadge = (adjustment: Adjustment) => {
        let typeName: string = '—';
        if (adjustment.adjustment_type) {
            if (typeof adjustment.adjustment_type === 'object' && 'name' in adjustment.adjustment_type) {
                typeName = String(adjustment.adjustment_type.name);
            } else if (typeof adjustment.adjustment_type === 'string') {
                typeName = adjustment.adjustment_type;
            }
        }
        const isPositive = ['Salary Refund', 'Underpayment', 'Overtime Adjustment', 'Deduction Refund', 'Holiday Pay Adjustment'].includes(typeName);

        if (isPositive) {
            return <Badge variant="default">{typeName}</Badge>;
        }
        return <Badge variant="destructive">{typeName}</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Payroll Adjustments</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Manage refunds, corrections, and biometric adjustments for this employee
                    </p>
                </div>
                <Button asChild className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md hover:shadow-lg">
                    <Link href={route('adjustments.create', { employee_id: employee.id })}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Adjustment
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <CustomComboBox
                            items={FULL_MONTHS.map((month, index) => ({ value: String(index + 1), label: month }))}
                            placeholder="All Months"
                            value={filterMonth}
                            onSelect={(value) => setFilterMonth(value)}
                        />
                        <CustomComboBox
                            items={availableYears.map((year) => ({ value: String(year), label: String(year) }))}
                            placeholder="All Years"
                            value={filterYear}
                            onSelect={(value) => setFilterYear(value)}
                        />
                        {hasActiveFilters && (
                            <Button variant="ghost" onClick={clearFilters}>
                                <X className="mr-1 h-4 w-4" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Adjustments Table */}
            <div className="rounded-md border">
                {filteredAdjustments.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-muted/20">
                            <TableRow className="border-b hover:bg-transparent">
                                <TableHead className="text-xs font-medium tracking-wider text-slate-500 uppercase">Type</TableHead>
                                <TableHead className="text-right text-xs font-medium tracking-wider text-slate-500 uppercase">Amount</TableHead>
                                <TableHead className="text-xs font-medium tracking-wider text-slate-500 uppercase">Pay Period</TableHead>
                                <TableHead className="text-xs font-medium tracking-wider text-slate-500 uppercase">Effectivity</TableHead>
                                <TableHead className="text-xs font-medium tracking-wider text-slate-500 uppercase">Reason</TableHead>
                                <TableHead className="text-xs font-medium tracking-wider text-slate-500 uppercase">Created</TableHead>
                                <TableHead className="text-xs font-medium tracking-wider text-slate-500 uppercase">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAdjustments.map((adjustment) => (
                                <TableRow key={adjustment.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <TableCell>{getTypeBadge(adjustment)}</TableCell>
                                    <TableCell className="text-right">
                                        <span
                                            className={`font-semibold ${
                                                adjustment.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                            }`}
                                        >
                                            {formatCurrency(adjustment.amount)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                                        {new Date(2026, adjustment.pay_period_month - 1).toLocaleString('default', {
                                            month: 'short',
                                        })}{' '}
                                        {adjustment.pay_period_year}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                                        {formatDate(adjustment.effectivity_date)}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-sm text-slate-700 dark:text-slate-300">
                                        {adjustment.reason}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">{formatDate(adjustment.created_at)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEditAdjustment(adjustment)}
                                                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteAdjustment(adjustment)}
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <RefreshCcw className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No adjustments yet</h3>
                        <p className="mt-1 text-sm text-slate-500">Create your first adjustment for this employee</p>
                        <Button asChild className="mt-4">
                            <Link href={route('adjustments.create', { employee_id: employee.id })}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Adjustment
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Adjustment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this adjustment? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-3">
                        {selectedAdjustment && (
                            <div className="space-y-2 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                                <div className="flex justify-between">
                                    <span className="font-medium">Amount:</span>
                                    <span>{formatCurrency(selectedAdjustment.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Period:</span>
                                    <span>
                                        {new Date(2026, selectedAdjustment.pay_period_month - 1).toLocaleString('default', {
                                            month: 'short',
                                        })}{' '}
                                        {selectedAdjustment.pay_period_year}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
