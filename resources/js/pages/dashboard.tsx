import { ChartOfficeClaims } from '@/components/chart-office-claims';
import { ChartPieMultiple } from '@/components/chart-pie-multiple';
import { CustomComboBox } from '@/components/CustomComboBox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Employee } from '@/types/employee';
import type { Office } from '@/types/office';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowUpRight,
    BarChart3,
    Building2,
    Calculator,
    ChevronRight,
    Clock,
    Coins,
    FileText,
    Filter,
    Key,
    MinusCircle,
    Receipt,
    Shield,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    stats: {
        totalEmployees: number;
        totalOffices: number;
        totalDeductionTypes: number;
        monthlyDeductionsCount: number;
        monthlyDeductionsTotal: number;
        employeesWithDeductions: number;
        totalClaims: number;
        totalClaimsAmount: number;
        totalSalaries: number;
        totalPera: number;
        totalRata: number;
        employeeGrowth: number;
        officesThisYear: number;
        claimsThisWeek: number;
    };
    salariesBySourceOfFund: {
        code: string;
        description: string | null;
        total_amount: number;
    }[];
    filters: {
        month: number;
        year: number;
    };
    employeesByOffice: (Office & { employees_count: number })[];
    recentEmployeesWithDeductions: (Employee & { total_deductions: number })[];
    topDeductionTypes: {
        deduction_type_id: number;
        total_amount: number;
        count: number;
        deduction_type: { name: string };
    }[];
    currentPeriod: {
        month: number;
        year: number;
        monthName: string;
    };
    recentActivity: {
        type: string;
        description: string;
        amount?: number;
        date: string;
    }[];
    highestTravelClaims: {
        id: number;
        employee_name: string;
        office: string;
        amount: number;
        claim_date: string;
        purpose: string;
    }[];
    topClaimants: {
        employee_id: number;
        employee_name: string;
        office: string;
        total_amount: number;
        claim_count: number;
    }[];
    mostTravelClaims: {
        employee_id: number;
        employee_name: string;
        office: string;
        travel_count: number;
        total_travel_amount: number;
    }[];
    mostOvertimeClaims: {
        employee_id: number;
        employee_name: string;
        office: string;
        overtime_count: number;
        total_overtime_amount: number;
    }[];
    claimsByOffice: {
        office_name: string;
        office_code: string;
        total_claims: number;
        total_amount: number;
    }[];
    employeesByEmploymentStatus: {
        id: number;
        name: string;
        count: number;
    }[];
    salaryDistribution: {
        id: number;
        code: string;
        description: string | null;
        codes: {
            code_id: number;
            code: string;
            code_description: string | null;
            total_amount: number;
            employee_count: number;
        }[];
        total_amount: number;
        employee_count: number;
    }[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num);
};

export default function Dashboard({
    stats,
    salaryDistribution,
    filters,
    employeesByOffice,
    recentEmployeesWithDeductions,
    topDeductionTypes,
    currentPeriod,
    recentActivity,
    highestTravelClaims,
    topClaimants,
    mostTravelClaims,
    mostOvertimeClaims,
    claimsByOffice,
    employeesByEmploymentStatus,
}: DashboardProps) {
    const [chartType, setChartType] = React.useState<'bar' | 'pie'>('bar');
    const [salaryViewMode, setSalaryViewMode] = React.useState<'byFund' | 'byCode'>('byFund');

    const {
        data: filterData,
        setData: setFilterData,
        get,
    } = useForm({
        month: filters.month.toString(),
        year: filters.year.toString(),
    });

    const months = [
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

    // Dynamic year range: fixed start year (2020) to current year + 5
    const currentYearDashboard = new Date().getFullYear();
    const startYearDashboard = 2020;
    const endYearDashboard = currentYearDashboard + 5;
    const years = Array.from({ length: endYearDashboard - startYearDashboard + 1 }, (_, i) => startYearDashboard + i);

    const handleFilterChange = (field: string, value: string) => {
        setFilterData(field as keyof typeof filterData, value);
        // Use router.get directly with the new values
        router.get(
            route('dashboard'),
            { ...filterData, [field]: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const yearOptions = years.map((year) => ({
        value: year.toString(),
        label: year.toString(),
    }));
    const statCards = [
        {
            title: 'Total Employees',
            value: formatNumber(stats.totalEmployees),
            description: 'Active workforce',
            icon: Users,
            color: 'bg-blue-500',
            trend: stats.employeeGrowth > 0 ? `+${stats.employeeGrowth}%` : stats.employeeGrowth < 0 ? `${stats.employeeGrowth}%` : 'No change',
        },
        {
            title: 'Total Offices',
            value: formatNumber(stats.totalOffices),
            description: 'Departments',
            icon: Building2,
            color: 'bg-emerald-500',
            trend: `+${formatNumber(stats.officesThisYear)} this year`,
        },
        {
            title: `${currentPeriod.monthName} Deductions`,
            value: formatCurrency(stats.monthlyDeductionsTotal),
            description: `${formatNumber(stats.monthlyDeductionsCount)} entries • ${formatNumber(stats.employeesWithDeductions)} employees`,
            icon: MinusCircle,
            color: 'bg-amber-500',
            trend: 'This month',
        },
        {
            title: 'Total Claims',
            value: formatCurrency(stats.totalClaimsAmount),
            description: `${formatNumber(stats.totalClaims)} total claims`,
            icon: Receipt,
            color: 'bg-violet-500',
            trend: `+${formatNumber(stats.claimsThisWeek)} this week`,
        },
    ];

    const compensationStats = [
        { label: 'Total Salaries', value: formatNumber(stats.totalSalaries), icon: Wallet, color: 'text-blue-600' },
        { label: 'PERA Allowances', value: formatNumber(stats.totalPera), icon: Coins, color: 'text-emerald-600' },
        { label: 'RATA Benefits', value: formatNumber(stats.totalRata), icon: TrendingUp, color: 'text-amber-600' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                        <p className="text-muted-foreground">
                            Welcome back! Here's what's happening with your payroll for1{' '}
                            <span className="font-medium text-slate-900 dark:text-white">
                                {months.find((m) => m.value === filterData.month)?.label || currentPeriod.monthName} {filterData.year}
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <CustomComboBox
                            items={months}
                            placeholder="All Months"
                            value={filterData.month || null}
                            onSelect={(value) => handleFilterChange('month', value ?? '')}
                            showClear={true}
                        />
                        <CustomComboBox
                            items={yearOptions}
                            placeholder="All Years"
                            value={filterData.year || null}
                            onSelect={(value) => handleFilterChange('year', value ?? '')}
                            showClear={true}
                        />
                        <Button onClick={() => router.get(route('payroll.index'))}>
                            View Payroll
                            <ArrowUpRight />
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((card, index) => (
                        <Card key={index} className="relative overflow-hidden transition-shadow hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                <div className={`${card.color} rounded-lg p-2`}>
                                    <card.icon className="h-4 w-4 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <p className="text-muted-foreground text-xs">{card.description}</p>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        {card.trend}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Compensation Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Compensation Overview
                        </CardTitle>
                        <CardDescription>Total compensation breakdown across all employees</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 sm:grid-cols-3">
                            {compensationStats.map((stat) => (
                                <div key={stat.label} className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800`}>
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                                        <p className="text-xl font-bold">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Salary Distribution */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Coins className="h-5 w-5" />
                                    Salary Distribution
                                </CardTitle>
                                <CardDescription>
                                    Breakdown by source of fund for {months.find((m) => m.value === filterData.month)?.label || 'Current'}{' '}
                                    {filterData.year}
                                </CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        {salaryViewMode === 'byFund' ? 'By Fund' : 'By Code'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuRadioGroup
                                        value={salaryViewMode}
                                        onValueChange={(value) => setSalaryViewMode(value as 'byFund' | 'byCode')}
                                    >
                                        <DropdownMenuRadioItem value="byFund">By Fund</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="byCode">By Code</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                </Card>

                {/* Salary Distribution Chart */}
                {salaryViewMode === 'byFund' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Salaries by General Fund</CardTitle>
                            <CardDescription>
                                Distribution for {months.find((m) => m.value === filterData.month)?.label || 'Current'} {filterData.year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartPieMultiple
                                data={salaryDistribution.map((fund) => ({
                                    code: fund.code,
                                    description: fund.description,
                                    total_amount: fund.total_amount,
                                }))}
                                title="Salaries by General Fund"
                                description={`Distribution for ${months.find((m) => m.value === filterData.month)?.label || 'Current'} ${filterData.year}`}
                            />
                        </CardContent>
                    </Card>
                )}

                {salaryViewMode === 'byCode' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Coins className="h-5 w-5" />
                                Salaries by Source of Fund Code
                            </CardTitle>
                            <CardDescription>
                                Distribution for {months.find((m) => m.value === filterData.month)?.label || 'Current'} {filterData.year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {salaryDistribution.flatMap((fund) => fund.codes).filter((code) => code.total_amount > 0).length > 0 ? (
                                <div className="space-y-3">
                                    {salaryDistribution
                                        .flatMap((fund) => fund.codes)
                                        .filter((code) => code.total_amount > 0)
                                        .sort((a, b) => b.total_amount - a.total_amount)
                                        .map((code, index) => {
                                            const maxAmount =
                                                salaryDistribution
                                                    .flatMap((fund) => fund.codes)
                                                    .filter((c) => c.total_amount > 0)
                                                    .sort((a, b) => b.total_amount - a.total_amount)[0]?.total_amount || 1;
                                            const percentage = (code.total_amount / maxAmount) * 100;
                                            return (
                                                <div key={code.code} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                                    index === 0
                                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                                        : index === 1
                                                                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                                          : index === 2
                                                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                                }`}
                                                            >
                                                                {index + 1}
                                                            </span>
                                                            <div>
                                                                <p className="font-medium">{code.code}</p>
                                                                <p className="text-muted-foreground text-xs">{code.code_description}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-blue-600">{formatCurrency(code.total_amount)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                        <Coins className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">No salary data available for this period</p>
                                </div>
                            )}
                        </CardContent>
                        {salaryDistribution.flatMap((fund) => fund.codes).filter((code) => code.total_amount > 0).length > 0 && (
                            <CardFooter className="flex-col items-start gap-2 text-sm">
                                <div className="text-muted-foreground text-xs">
                                    Showing salary distribution across{' '}
                                    {salaryDistribution.flatMap((fund) => fund.codes).filter((code) => code.total_amount > 0).length} source codes
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                )}

                {/* Travel & Overtime Claims Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Top 10 Travel Claims Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />
                                    Top 10 Travel Claims by Employee
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => router.get(route('claims.report', { type: 'travel' }))}>
                                    View All
                                    <ArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                            <CardDescription>
                                Employees with highest travel claim amounts for {months.find((m) => m.value === filterData.month)?.label || 'Current'}{' '}
                                {filterData.year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mostTravelClaims.length > 0 ? (
                                <div className="space-y-3">
                                    {mostTravelClaims.map((employee, index) => {
                                        const maxAmount = mostTravelClaims[0]?.total_travel_amount || 1;
                                        const percentage = (employee.total_travel_amount / maxAmount) * 100;
                                        return (
                                            <div key={employee.employee_id} className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                                index === 0
                                                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                                    : index === 1
                                                                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                                      : index === 2
                                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <button
                                                                onClick={() => router.get(route('claims.employee.detail', employee.employee_id))}
                                                                className="cursor-pointer text-left font-medium text-blue-600 hover:underline"
                                                            >
                                                                {employee.employee_name}
                                                            </button>
                                                            <p className="text-muted-foreground text-xs">{employee.office}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-blue-600">{formatCurrency(employee.total_travel_amount)}</p>
                                                        <p className="text-muted-foreground text-xs">{formatNumber(employee.travel_count)} trips</p>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                        <Receipt className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">No travel claims data for this period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top 10 Overtime Claims Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Top 10 Overtime Claims by Employee
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => router.get(route('claims.report', { type: 'overtime' }))}>
                                    View All
                                    <ArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                            <CardDescription>
                                Employees with highest overtime compensation for{' '}
                                {months.find((m) => m.value === filterData.month)?.label || 'Current'} {filterData.year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mostOvertimeClaims.length > 0 ? (
                                <div className="space-y-3">
                                    {mostOvertimeClaims.map((employee, index) => {
                                        const maxAmount = mostOvertimeClaims[0]?.total_overtime_amount || 1;
                                        const percentage = (employee.total_overtime_amount / maxAmount) * 100;
                                        return (
                                            <div key={employee.employee_id} className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                                index === 0
                                                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                                    : index === 1
                                                                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                                      : index === 2
                                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <button
                                                                onClick={() => router.get(route('claims.employee.detail', employee.employee_id))}
                                                                className="cursor-pointer text-left font-medium text-emerald-600 hover:underline"
                                                            >
                                                                {employee.employee_name}
                                                            </button>
                                                            <p className="text-muted-foreground text-xs">{employee.office}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-emerald-600">
                                                            {formatCurrency(employee.total_overtime_amount)}
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {formatNumber(employee.overtime_count)} claims
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                        <Clock className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">No overtime claims data for this period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Claims & Overtime by Office Chart */}
                <Card>
                    <CardContent className="pt-6">
                        <ChartOfficeClaims
                            data={claimsByOffice}
                            title="Claims & Overtime by Office"
                            description={`Distribution of claims and overtime for ${months.find((m) => m.value === filterData.month)?.label || currentPeriod.monthName} ${filterData.year}`}
                        />
                    </CardContent>
                </Card>

                {/* Employment Type Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Employees by Employment Type
                        </CardTitle>
                        <CardDescription>Total employees grouped by employment status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {employeesByEmploymentStatus.length > 0 ? (
                            <div className="space-y-3">
                                {employeesByEmploymentStatus.map((status) => (
                                    <button
                                        key={status.id}
                                        onClick={() => router.get(route('reports.employment-type', { employment_status_id: status.id }))}
                                        className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
                                                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{status.name}</p>
                                                <p className="text-muted-foreground text-xs">Click to view employees</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatNumber(status.count)}</p>
                                            <p className="text-muted-foreground text-xs">employees</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <Users className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-muted-foreground text-sm">No employment types found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-7">
                    {/* Top Deduction Types */}
                    <Card className="lg:col-span-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5" />
                                Top Deduction Types
                            </CardTitle>
                            <CardDescription>Highest deduction categories for {currentPeriod.monthName}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topDeductionTypes.length > 0 ? (
                                    topDeductionTypes.map((item, index) => {
                                        const maxAmount = topDeductionTypes[0]?.total_amount || 1;
                                        const percentage = (item.total_amount / maxAmount) * 100;
                                        return (
                                            <div key={item.deduction_type_id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                                                            <span className="text-primary text-sm font-bold">{index + 1}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{item.deduction_type.name}</p>
                                                            <p className="text-muted-foreground text-xs">{formatNumber(item.count)} entries</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-semibold">{formatCurrency(item.total_amount)}</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className="bg-primary h-full rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center">
                                        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                            <FileText className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="text-muted-foreground">No deductions recorded for this month</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employees with Deductions */}
                    <Card className="lg:col-span-3">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Recent Deductions
                                </CardTitle>
                                <CardDescription>Employees with deductions this month</CardDescription>
                            </div>
                            <button
                                onClick={() => router.get(route('employee-deductions.index'))}
                                className="text-primary text-sm font-medium hover:underline"
                            >
                                View All
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentEmployeesWithDeductions.length > 0 ? (
                                    recentEmployeesWithDeductions.map((employee) => (
                                        <div
                                            key={employee.id}
                                            className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                                            onClick={() => router.get(route('manage.employees.show', employee.id))}
                                        >
                                            <Avatar className="h-10 w-10 border">
                                                {employee.image_path ? (
                                                    <AvatarImage src={employee.image_path} alt={`${employee.first_name} ${employee.last_name}`} />
                                                ) : null}
                                                <AvatarFallback className="bg-slate-100">
                                                    <Users className="h-5 w-5 text-slate-400" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">
                                                    {employee.last_name}, {employee.first_name}
                                                </p>
                                                <p className="text-muted-foreground truncate text-xs">{employee.office?.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{formatCurrency(Number(employee.total_deductions))}</span>
                                                <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-muted-foreground text-sm">No employees with deductions this month</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Employees by Office */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Employees by Office
                        </CardTitle>
                        <CardDescription>Workforce distribution across departments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {employeesByOffice.slice(0, 8).map((office) => (
                                <div
                                    key={office.id}
                                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                            <Building2 className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <span className="text-sm font-medium">{office.name}</span>
                                    </div>
                                    <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                        {office.employees_count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks for managing your payroll system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    icon: Receipt,
                                    title: 'Claims Report',
                                    desc: 'View all claims',
                                    route: 'claims.report',
                                    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300',
                                },
                                {
                                    icon: MinusCircle,
                                    title: 'View Deductions',
                                    desc: 'Manage all deductions',
                                    route: 'employee-deductions.index',
                                    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
                                },
                                {
                                    icon: Users,
                                    title: 'Employees',
                                    desc: 'View employee list',
                                    route: 'employees.index',
                                    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
                                },
                                {
                                    icon: FileText,
                                    title: 'Deduction Types',
                                    desc: 'Manage categories',
                                    route: 'deduction-types.index',
                                    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
                                },
                                {
                                    icon: Calculator,
                                    title: 'Add Employee',
                                    desc: 'Create new record',
                                    route: 'employees.create',
                                    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300',
                                },
                                {
                                    icon: Shield,
                                    title: 'Roles',
                                    desc: 'Manage user roles',
                                    route: 'roles.index',
                                    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
                                },
                                {
                                    icon: Key,
                                    title: 'Permissions',
                                    desc: 'Manage permissions',
                                    route: 'permissions.index',
                                    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300',
                                },
                            ].map((action) => (
                                <button
                                    key={action.title}
                                    onClick={() => router.get(route(action.route))}
                                    className="group hover:border-primary/50 flex items-center gap-3 rounded-lg border p-4 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                                        <action.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{action.title}</p>
                                        <p className="text-muted-foreground text-xs">{action.desc}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
