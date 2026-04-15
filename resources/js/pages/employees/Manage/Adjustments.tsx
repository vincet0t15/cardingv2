import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Employee } from '@/types/employee';
import { Link, router } from '@inertiajs/react';
import { CheckCircle, Clock, DollarSign, Plus, RefreshCcw, XCircle } from 'lucide-react';

interface Adjustment {
    id: number;
    employee_id: number;
    adjustment_type: string;
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

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
            approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            processed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        };

        const icons: Record<string, any> = {
            pending: Clock,
            approved: CheckCircle,
            rejected: XCircle,
            processed: RefreshCcw,
        };

        const Icon = icons[status] || Clock;

        return (
            <Badge className={`${variants[status] || variants.pending} gap-1 px-2 py-1`}>
                <Icon className="h-3 w-3" />
                <span className="capitalize">{status}</span>
            </Badge>
        );
    };

    const getTypeBadge = (type: string) => {
        const isPositive = ['Salary Refund', 'Underpayment', 'Overtime Adjustment', 'Deduction Refund', 'Holiday Pay Adjustment'].includes(type);

        return (
            <Badge variant={isPositive ? 'default' : 'destructive'} className="gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{type}</span>
            </Badge>
        );
    };

    const handleApprove = (id: number) => {
        router.post(route('adjustments.approve', id));
    };

    const handleReject = (id: number) => {
        router.post(route('adjustments.reject', id), {
            rejection_reason: 'Rejected via employee page',
        });
    };

    const handleProcess = (id: number) => {
        router.post(route('adjustments.process', id));
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this adjustment?')) {
            router.delete(route('adjustments.destroy', id));
        }
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
                    <Link href={route('adjustments.create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Adjustment
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-amber-400 opacity-10 blur-2xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900">{statistics.total_pending}</div>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-blue-400 opacity-10 blur-2xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{statistics.total_approved}</div>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-400 opacity-10 blur-2xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700">Processed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900">{statistics.total_processed}</div>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-pink-50 shadow-sm">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-red-400 opacity-10 blur-2xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Rejected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">{statistics.total_rejected}</div>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-purple-400 opacity-10 blur-2xl" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-purple-900">{formatCurrency(statistics.total_amount)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Adjustments Table */}
            <Card>
                <CardContent className="p-0">
                    {adjustments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-slate-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                                            Pay Period
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                                            Effectivity
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Reason</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {adjustments.map((adjustment) => (
                                        <tr key={adjustment.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3">{getTypeBadge(adjustment.adjustment_type)}</td>
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
                                            <td className="px-4 py-3 text-center">{getStatusBadge(adjustment.status)}</td>
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
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {adjustment.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-emerald-600 hover:text-emerald-700"
                                                                onClick={() => handleApprove(adjustment.id)}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-red-600 hover:text-red-700"
                                                                onClick={() => handleReject(adjustment.id)}
                                                            >
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-slate-600 hover:text-slate-700"
                                                                onClick={() => handleDelete(adjustment.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </>
                                                    )}
                                                    {adjustment.status === 'approved' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-blue-600 hover:text-blue-700"
                                                            onClick={() => handleProcess(adjustment.id)}
                                                        >
                                                            Process
                                                        </Button>
                                                    )}
                                                    {adjustment.status === 'rejected' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-slate-600 hover:text-slate-700"
                                                            onClick={() => handleDelete(adjustment.id)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
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
                                <Link href={route('adjustments.create')}>
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
