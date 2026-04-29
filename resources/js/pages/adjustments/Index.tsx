import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { Adjustment } from '@/types';
import type { Employee } from '@/types/employee';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, Clock, DollarSign, Filter, Plus, RefreshCcw, Search, Users, XCircle } from 'lucide-react';

interface Props {
    adjustments: {
        data: Adjustment[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
    };
    employees: Employee[];
    filters: {
        status?: string;
        type?: string;
        employee_id?: string;
        month?: string;
        year?: string;
        search?: string;
    };
    statistics: {
        total_pending: number;
        total_approved: number;
        total_processed: number;
        total_amount_pending: number;
        total_amount_approved: number;
        total_amount_processed: number;
        unique_employees: number;
    };
}

export default function Index({ adjustments, employees, filters, statistics }: Props) {
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

    // CustomComboBox options
    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'processed', label: 'Processed' },
    ];

    const typeOptions = [
        { value: '', label: 'All Types' },
        { value: 'Salary Refund', label: 'Salary Refund' },
        { value: 'Underpayment', label: 'Underpayment' },
        { value: 'Overtime Adjustment', label: 'Overtime Adjustment' },
        { value: 'Late Adjustment', label: 'Late Adjustment' },
        { value: 'Deduction Refund', label: 'Deduction Refund' },
        { value: 'Correction', label: 'Correction' },
        { value: 'Absence Adjustment', label: 'Absence Adjustment' },
        { value: 'Holiday Pay Adjustment', label: 'Holiday Pay Adjustment' },
    ];

    const monthOptions = [
        { value: '', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    const yearOptions = [
        { value: '', label: 'All Years' },
        { value: '2026', label: '2026' },
        { value: '2025', label: '2025' },
        { value: '2024', label: '2024' },
        { value: '2023', label: '2023' },
    ];

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

    const getTypeBadge = (type: any) => {
        const name = typeof type === 'object' ? (type?.name ?? '—') : (type ?? '—');
        const isPositive = ['Salary Refund', 'Underpayment', 'Overtime Adjustment', 'Deduction Refund', 'Holiday Pay Adjustment'].includes(name);

        return (
            <Badge variant={isPositive ? 'default' : 'destructive'} className="gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{name}</span>
            </Badge>
        );
    };

    const handleFilterChange = (key: string, value: string | null) => {
        router.get(
            '/adjustments',
            {
                ...filters,
                [key]: value || undefined,
                page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const clearFilters = () => {
        router.get('/adjustments', {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Adjustments" />

            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-md border border-teal-200 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 p-6 dark:from-teal-950/30 dark:via-cyan-950/30 dark:to-blue-950/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
                                <RefreshCcw className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Payroll Adjustments</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Manage refunds, corrections, and LGU biometric adjustments
                                </p>
                            </div>
                        </div>
                        <Button asChild className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md hover:shadow-lg">
                            <Link href={route('adjustments.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Adjustment
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm dark:from-amber-950/30 dark:to-orange-950/30">
                        <div className="absolute top-0 right-0 h-24 w-24 bg-amber-400 opacity-10 blur-2xl transition-all group-hover:opacity-20" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{statistics.total_pending}</div>
                                <div className="text-xs text-amber-600 dark:text-amber-400">{formatCurrency(statistics.total_amount_pending)}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:from-blue-950/30 dark:to-indigo-950/30">
                        <div className="absolute top-0 right-0 h-24 w-24 bg-blue-400 opacity-10 blur-2xl transition-all group-hover:opacity-20" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Approved</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{statistics.total_approved}</div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">{formatCurrency(statistics.total_amount_approved)}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm dark:from-emerald-950/30 dark:to-teal-950/30">
                        <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-400 opacity-10 blur-2xl transition-all group-hover:opacity-20" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Processed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{statistics.total_processed}</div>
                                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(statistics.total_amount_processed)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm dark:from-purple-950/30 dark:to-pink-950/30">
                        <div className="absolute top-0 right-0 h-24 w-24 bg-purple-400 opacity-10 blur-2xl transition-all group-hover:opacity-20" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Employees</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{statistics.unique_employees}</div>
                            </div>
                            <div className="text-xs text-purple-600 dark:text-purple-400">With adjustments</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filters
                            </CardTitle>
                            {(filters.status || filters.type || filters.search || filters.month || filters.year) && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-6">
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Search employee, reason..."
                                        defaultValue={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <CustomComboBox
                                items={statusOptions}
                                placeholder="All Status"
                                value={filters.status || null}
                                onSelect={(value) => handleFilterChange('status', value)}
                            />

                            <CustomComboBox
                                items={typeOptions}
                                placeholder="All Types"
                                value={filters.type || null}
                                onSelect={(value) => handleFilterChange('type', value)}
                            />

                            <CustomComboBox
                                items={monthOptions}
                                placeholder="All Months"
                                value={filters.month?.toString() || null}
                                onSelect={(value) => handleFilterChange('month', value)}
                            />

                            <CustomComboBox
                                items={yearOptions}
                                placeholder="All Years"
                                value={filters.year?.toString() || null}
                                onSelect={(value) => handleFilterChange('year', value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        {adjustments.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                                                Employee
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase">
                                                Amount
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-slate-500 uppercase">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                                                Pay Period
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                                                Effectivity
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
                                                Created
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-slate-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {adjustments.data.map((adjustment) => (
                                            <tr key={adjustment.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                                        {adjustment.employee.first_name} {adjustment.employee.last_name}
                                                    </div>
                                                    {adjustment.employee.employee_id && (
                                                        <div className="text-xs text-slate-500">{adjustment.employee.employee_id}</div>
                                                    )}
                                                </td>
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
                                                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                                    {formatDate(adjustment.created_at)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {adjustment.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    asChild
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-amber-600 hover:text-amber-700"
                                                                >
                                                                    <Link href={route('adjustments.edit', adjustment.id)}>Edit</Link>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-emerald-600 hover:text-emerald-700"
                                                                    onClick={() => router.post(route('adjustments.approve', adjustment.id))}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-red-600 hover:text-red-700"
                                                                    onClick={() => router.post(route('adjustments.reject', adjustment.id))}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
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
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No adjustments found</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {Object.values(filters).some((f) => f)
                                        ? 'Try clearing your filters'
                                        : 'Create your first adjustment to get started'}
                                </p>
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

                {/* Pagination */}
                {adjustments.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            Page {adjustments.current_page} of {adjustments.last_page}
                        </p>
                        <div className="flex gap-2">
                            {adjustments.links.map((link, index) => (
                                <Button
                                    key={index}
                                    asChild
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    className={link.active ? 'bg-gradient-to-r from-teal-600 to-cyan-600' : ''}
                                >
                                    <Link href={link.url || '#'} dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
