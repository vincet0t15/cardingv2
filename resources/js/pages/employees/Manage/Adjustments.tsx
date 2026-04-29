import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Employee } from '@/types/employee';
import { Link, router } from '@inertiajs/react';
import { Pencil, Plus, RefreshCcw, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DeleteAdjustmentDialog } from './DeleteAdjustmentDialog';

interface AdjustmentType {
    id?: number;
    name?: string;
}

export interface Adjustment {
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

    const getTypeName = (type: string | AdjustmentType): string => {
        return typeof type === 'string' ? type : (type.name ?? 'Adjustment');
    };

    const getTypeBadge = (adjustment: Adjustment) => {
        const typeName = getTypeName(adjustment.adjustment_type);
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
                <Button asChild variant={'default'}>
                    <Link href={route('adjustments.create', { employee_id: employee.id, tab: 'adjustments' })}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Adjustment
                    </Link>
                </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Pending</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-600">{statistics.total_pending}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Approved</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-600">{statistics.total_approved}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Total amount</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(statistics.total_amount)}</p>
                </div>
            </div>

            {/* Filters */}

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
                        <TableBody className="bg-white">
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
            <DeleteAdjustmentDialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setSelectedAdjustment(null);
                }}
                adjustment={selectedAdjustment}
            />
        </div>
    );
}
