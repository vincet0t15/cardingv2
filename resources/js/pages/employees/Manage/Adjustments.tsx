import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Employee } from '@/types/employee';
import { Link } from '@inertiajs/react';
import { Plus, RefreshCcw, X } from 'lucide-react';
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

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
            <Card>
                <CardContent className="p-0">
                    {filteredAdjustments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                                            Pay Period
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                                            Effectivity
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Reason</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredAdjustments.map((adjustment) => (
                                        <tr key={adjustment.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3">{getTypeBadge(adjustment)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span
                                                    className={`font-semibold ${
                                                        adjustment.amount >= 0
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }`}
                                                >
                                                    {formatCurrency(adjustment.amount)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                                {new Date(2026, adjustment.pay_period_month - 1).toLocaleString('default', {
                                                    month: 'short',
                                                })}{' '}
                                                {adjustment.pay_period_year}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                                {formatDate(adjustment.effectivity_date)}
                                            </td>
                                            <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                                {adjustment.reason}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {formatDate(adjustment.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                </CardContent>
            </Card>
        </div>
    );
}
