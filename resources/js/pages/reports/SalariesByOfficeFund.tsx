import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowUpRight, Building2, Coins, DollarSign, Landmark, Printer, Wallet } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Salaries by Office & Fund',
        href: '/salaries/by-office-fund',
    },
];

interface OfficeFund {
    source_of_fund_code_id: number;
    code: string;
    code_description: string | null;
    general_fund_name: string | null;
    general_fund_code: string | null;
    total_amount: number;
    employee_count: number;
}

interface OfficeData {
    id: number;
    name: string;
    funds: OfficeFund[];
    total_amount: number;
}

interface SourceOfFundCodeItem {
    id: number;
    code: string;
    description: string | null;
}

interface OfficeItem {
    id: number;
    name: string;
}

interface Props {
    offices: OfficeData[];
    allOffices: OfficeItem[];
    sourceOfFundCodes: SourceOfFundCodeItem[];
    summary: {
        total_offices: number;
        total_fund_codes: number;
        total_amount: number;
    };
    months: { value: string; label: string }[];
    filters: {
        month: number;
        year: number;
        office_id: number | null;
    };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num);
};

export default function SalariesByOfficeFund({ offices, allOffices, sourceOfFundCodes, summary, months, filters }: Props) {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 5;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => ({
        value: (startYear + i).toString(),
        label: (startYear + i).toString(),
    }));

    const handleFilterChange = (field: string, value: string) => {
        router.get(
            route('salaries.by-office-fund'),
            { ...filters, [field]: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePrint = () => {
        const params = new URLSearchParams();
        params.append('month', filters.month.toString());
        params.append('year', filters.year.toString());
        if (filters.office_id) params.append('office_id', filters.office_id.toString());
        window.open(route('salaries.by-office-fund.print') + '?' + params.toString(), '_blank');
    };

    const getGeneralFundColor = (index: number) => {
        const colors = [
            'from-teal-500 to-cyan-600',
            'from-blue-500 to-indigo-600',
            'from-emerald-500 to-green-600',
            'from-violet-500 to-purple-600',
            'from-amber-500 to-orange-600',
            'from-rose-500 to-pink-600',
            'from-sky-500 to-blue-600',
            'from-lime-500 to-green-600',
        ];
        return colors[index % colors.length];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Salaries by Office & Source of Fund" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="rounded-md border border-teal-200 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 p-6 dark:from-teal-950/30 dark:via-cyan-950/30 dark:to-blue-950/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
                                <Landmark className="h-7 w-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    Salaries by Office & Source of Fund
                                </h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Breakdown of salary amounts by office and funding source for{' '}
                                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                                        {months.find((m) => m.value === filters.month.toString())?.label} {filters.year}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-950/30"
                        >
                            <Printer className="mr-1 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                {/* Filters Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <CustomComboBox
                                items={months}
                                placeholder="Select month"
                                value={filters.month.toString()}
                                onSelect={(value) => handleFilterChange('month', value ?? '')}
                            />
                            <CustomComboBox
                                items={years}
                                placeholder="Select year"
                                value={filters.year.toString()}
                                onSelect={(value) => handleFilterChange('year', value ?? '')}
                            />
                            <CustomComboBox
                                items={allOffices.map((o) => ({ value: o.id.toString(), label: o.name }))}
                                placeholder="All Offices"
                                value={filters.office_id?.toString() || null}
                                onSelect={(value) => handleFilterChange('office_id', value ?? '')}
                                showClear={true}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm dark:from-emerald-950/30 dark:to-teal-950/30">
                        <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-400 opacity-10 blur-2xl transition-all group-hover:opacity-20" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Offices</CardTitle>
                            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2 shadow-sm transition-transform group-hover:scale-110">
                                <Building2 className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{formatNumber(summary.total_offices)}</div>
                            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">With active salaries</p>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:from-blue-950/30 dark:to-indigo-950/30">
                        <div className="absolute top-0 right-0 h-24 w-24 bg-blue-400 opacity-10 blur-2xl transition-all group-hover:opacity-20" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Fund Codes</CardTitle>
                            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-sm transition-transform group-hover:scale-110">
                                <Coins className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatNumber(summary.total_fund_codes)}</div>
                            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Source of fund codes</p>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-violet-50 to-purple-50 shadow-sm dark:from-violet-950/30 dark:to-purple-950/30">
                        <div className="absolute top-0 right-0 h-24 w-24 bg-violet-400 opacity-10 blur-2xl transition-all group-hover:opacity-20" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">Total Salaries</CardTitle>
                            <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-2 shadow-sm transition-transform group-hover:scale-110">
                                <DollarSign className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-violet-900 dark:text-violet-100">{formatCurrency(summary.total_amount)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Office by Office Breakdown */}
                {offices.length > 0 ? (
                    <div className="space-y-6">
                        {offices.map((office, oi) => {
                            const maxOfficeAmount = offices[0]?.total_amount || 1;
                            const officePercentage = (office.total_amount / maxOfficeAmount) * 100;
                            return (
                                <Card key={office.id} className="overflow-hidden border-0 shadow-sm">
                                    <div className="bg-gradient-to-r from-slate-50 to-white p-5 dark:from-slate-800 dark:to-slate-900">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-sm">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{office.name}</h3>
                                                    <p className="text-xs text-slate-500">
                                                        {office.funds.length} fund code{office.funds.length !== 1 ? 's' : ''} •{' '}
                                                        {formatNumber(office.funds.reduce((sum, f) => sum + f.employee_count, 0))} employees
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 px-3 py-1.5 text-sm text-white">
                                                    {formatCurrency(office.total_amount)}
                                                </Badge>
                                            </div>
                                        </div>
                                        {/* Office-level progress bar */}
                                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all"
                                                style={{ width: `${officePercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {office.funds.length > 0 && (
                                        <CardContent className="p-5 pt-3">
                                            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                                                <Wallet className="h-3.5 w-3.5" />
                                                Fund Breakdown
                                            </div>
                                            <div className="space-y-3">
                                                {office.funds.map((fund, fi) => {
                                                    const maxAmount = office.funds[0]?.total_amount || 1;
                                                    const percentage = (fund.total_amount / maxAmount) * 100;
                                                    return (
                                                        <div key={fund.source_of_fund_code_id} className="space-y-1">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                                            fi === 0
                                                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                                                : fi === 1
                                                                                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                                                  : fi === 2
                                                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                                        }`}
                                                                    >
                                                                        {fi + 1}
                                                                    </span>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                                                                {fund.code}
                                                                            </span>
                                                                            {fund.general_fund_name && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="border-teal-200 bg-teal-50 text-xs text-teal-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-300"
                                                                                >
                                                                                    {fund.general_fund_name}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {fund.code_description && (
                                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                                {fund.code_description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-semibold text-teal-600 dark:text-teal-400">
                                                                        {formatCurrency(fund.total_amount)}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {formatNumber(fund.employee_count)} employee
                                                                        {fund.employee_count !== 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                                                <div
                                                                    className={`h-full rounded-full bg-gradient-to-r ${getGeneralFundColor(fi)} transition-all`}
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <Landmark className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No salary data found</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                No active salaries found for {months.find((m) => m.value === filters.month.toString())?.label} {filters.year}. Try
                                a different month or year.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
