import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Adjustment, type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Claim, ClaimFilters } from '@/types/claim';
import type { ClaimType } from '@/types/claimType';
import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import type { Office } from '@/types/office';
import type { PaginatedDataResponse } from '@/types/pagination';
import { ArrowLeft, CoinsIcon, FileText, LayoutDashboard, Receipt, RefreshCcw, Settings, TrendingDown } from 'lucide-react';

import EmployeeAdjustments from './Adjustments';
import EmployeeCompensation from './Compensation';
import Overview from './Overview';
import Reports from './Reports';
import EmployeeSettings from './Settings';
import { EmployeeClaims } from './claims';
import { CompensationDeductions } from './compensation/deductions';

interface EmployeeManageProps {
    employee: Employee;
    employmentStatuses: EmploymentStatus[];
    offices: Office[];
    deductionTypes: DeductionType[];
    sourceOfFundCodes?: { id: number; code: string; description: string | null; status: boolean }[];
    deductions?: Record<string, EmployeeDeduction[]>;
    periodsList?: string[];
    takenPeriods?: string[];
    availableYears?: number[];
    allEmployees?: Employee[];
    filters?: {
        deduction_month?: string;
        deduction_year?: string;
    };
    deductionPagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    // Claims
    claims?: PaginatedDataResponse<Claim>;
    claimTypes?: ClaimType[];
    availableClaimYears?: number[];
    claimFilters?: ClaimFilters;
    // Overview & Reports
    allDeductions?: EmployeeDeduction[];
    allClaims?: Claim[];
    allClaimsGrouped?: Record<string, Claim[]>;
    allClothingAllowances?: {
        id: number;
        amount: string | number;
        start_date: string;
        end_date: string | null;
        source_of_fund_code?: { code: string; description: string | null } | null;
    }[];
    totalDeductionsAllTime?: number;
    totalClaimsAllTime?: number;
    // Adjustments
    adjustments?: Adjustment[];
    allAdjustmentsGrouped?: Record<string, Adjustment[]>;
    adjustmentStatistics?: {
        total_pending: number;
        total_approved: number;
        total_processed: number;
        total_rejected: number;
        total_amount: number;
    };
}

export default function EmployeeManagePage({
    employee,
    employmentStatuses,
    offices,
    deductionTypes,
    sourceOfFundCodes,
    deductions = {},
    periodsList = [],
    takenPeriods = [],
    availableYears = [],
    allEmployees = [],
    filters = {},
    deductionPagination,
    claims,
    claimTypes = [],
    availableClaimYears = [],
    claimFilters = {},
    allDeductions = [],
    allClaims = [],
    allClaimsGrouped = {},
    allClothingAllowances = [],
    totalDeductionsAllTime = 0,
    totalClaimsAllTime = 0,
    adjustments = [],
    allAdjustmentsGrouped = {},
    adjustmentStatistics = { total_pending: 0, total_approved: 0, total_processed: 0, total_rejected: 0, total_amount: 0 },
}: EmployeeManageProps) {
    const { url } = usePage();

    // Get active tab from URL or default to 'overview'
    const getInitialTab = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const validTabs = ['overview', 'compensation', 'deductions', 'claims', 'adjustments', 'reports', 'settings'];
        return tabParam && validTabs.includes(tabParam) ? tabParam : 'overview';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const validTabs = ['overview', 'compensation', 'deductions', 'claims', 'adjustments', 'reports', 'settings'];
        if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
    }, [url, activeTab]);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employees', href: '/employees' },
        { title: `${employee.last_name}, ${employee.first_name}`, href: `/manage/employees/${employee.id}` },
    ];

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '₱0.00';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getInitials = () => {
        const fn = employee.first_name ? employee.first_name.trim() : '';
        const ln = employee.last_name ? employee.last_name.trim() : '';
        if (!fn && !ln) return 'NA';
        return `${(fn[0] || '').toUpperCase()}${(ln[0] || '').toUpperCase()}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${employee.last_name}, ${employee.first_name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Back Button */}
                <Button variant="outline" className="w-fit" onClick={() => router.get(route('employees.index'))}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Employees
                </Button>

                {/* --- PROFESSIONAL HEADER SECTION --- */}
                <header className="rounded-md border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:border-blue-800 dark:from-blue-900/10 dark:to-purple-900/10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg dark:border-gray-800">
                            {employee.image_path ? (
                                <AvatarImage
                                    src={employee.image_path}
                                    alt={`${employee.first_name} ${employee.last_name}`}
                                    className="object-cover"
                                />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-3xl font-bold text-white">
                                    {getInitials()}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight uppercase">
                                    {employee.card_color ? (
                                        <span
                                            className="inline-block h-4 w-4 flex-shrink-0 rounded-full border border-white shadow"
                                            style={{ backgroundColor: employee.card_color }}
                                            aria-hidden
                                        />
                                    ) : null}
                                    <span>
                                        {employee.last_name}, {employee.first_name}
                                    </span>
                                </h1>
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                    {employee.employment_status?.name}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                <span className="font-medium">{employee.position}</span>
                                <span className="text-slate-300">•</span>
                                <span>{employee.office?.name}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div>
                                    <span className="text-2xl font-bold text-slate-900">{formatCurrency(employee.latest_salary?.amount)}</span>
                                    <span className="ml-1 text-sm text-slate-500">/ month</span>
                                </div>
                                {employee.latest_hazard_pay?.amount && (
                                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                        +{formatCurrency(employee.latest_hazard_pay.amount)} Hazard
                                    </Badge>
                                )}
                                {employee.latest_clothing_allowance?.amount && (
                                    <Badge variant="outline" className="border-pink-200 bg-pink-50 text-pink-700">
                                        +{formatCurrency(employee.latest_clothing_allowance.amount)} Clothing
                                    </Badge>
                                )}
                            </div>

                            {/* Quick stats badges (all-time) */}
                            <div className="mt-3 flex flex-wrap gap-2">
                                <div className="rounded-md border border-slate-100 bg-white px-3 py-2 text-sm shadow-sm">
                                    <div className="text-muted-foreground text-xs">Total Deductions (all-time)</div>
                                    <div className="text-lg font-semibold text-rose-600">{formatCurrency(totalDeductionsAllTime)}</div>
                                </div>
                                <div className="rounded-md border border-slate-100 bg-white px-3 py-2 text-sm shadow-sm">
                                    <div className="text-muted-foreground text-xs">Total Claims (all-time)</div>
                                    <div className="text-lg font-semibold text-emerald-600">{formatCurrency(totalClaimsAllTime)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <Separator className="bg-slate-200/60" />

                {/* --- TABS SECTION --- */}
                <Tabs value={activeTab} className="space-y-6">
                    <div className="overflow-x-auto pb-2">
                        <TabsList variant={'line'}>
                            <TabsTrigger
                                asChild
                                value="overview"
                                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 shadow-slate-200/60 transition hover:font-semibold hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                            >
                                <Link href={route('manage.employees.index', { employee: employee.id, tab: 'overview' })}>
                                    <LayoutDashboard className="h-4 w-4" /> Overview
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger
                                asChild
                                value="compensation"
                                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 shadow-slate-200/60 transition hover:bg-white hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                            >
                                <Link href={route('manage.employees.index', { employee: employee.id, tab: 'compensation' })}>
                                    <CoinsIcon className="h-4 w-4" /> Compensation
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger
                                asChild
                                value="deductions"
                                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 shadow-slate-200/60 transition hover:bg-white hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                            >
                                <Link href={route('manage.employees.index', { employee: employee.id, tab: 'deductions' })}>
                                    <TrendingDown className="h-4 w-4" /> Deductions
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger
                                asChild
                                value="claims"
                                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 shadow-slate-200/60 transition hover:bg-white hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                            >
                                <Link href={route('manage.employees.index', { employee: employee.id, tab: 'claims' })}>
                                    <Receipt className="h-4 w-4" /> Claims
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger
                                asChild
                                value="adjustments"
                                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 shadow-slate-200/60 transition hover:bg-white hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                            >
                                <Link href={route('manage.employees.index', { employee: employee.id, tab: 'adjustments' })}>
                                    <RefreshCcw className="h-4 w-4" /> Adjustments
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger
                                asChild
                                value="reports"
                                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 shadow-slate-200/60 transition hover:bg-white hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                            >
                                <Link href={route('manage.employees.index', { employee: employee.id, tab: 'reports' })}>
                                    <FileText className="h-4 w-4" /> Reports
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger
                                asChild
                                value="settings"
                                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 shadow-slate-200/60 transition hover:bg-white hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                            >
                                <Link href={route('manage.employees.index', { employee: employee.id, tab: 'settings' })}>
                                    <Settings className="h-4 w-4" /> Settings
                                </Link>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="mt-0 outline-none">
                        <Overview
                            employee={employee}
                            deductions={deductions}
                            claims={allClaims}
                            totalDeductionsAllTime={totalDeductionsAllTime}
                            totalClaimsAllTime={totalClaimsAllTime}
                            adjustments={adjustments}
                        />
                    </TabsContent>
                    <TabsContent value="compensation" className="mt-0 outline-none">
                        <EmployeeCompensation employee={employee} sourceOfFundCodes={sourceOfFundCodes} />
                    </TabsContent>
                    <TabsContent value="deductions" className="mt-0 outline-none">
                        <CompensationDeductions
                            employee={employee}
                            deductionTypes={deductionTypes}
                            deductions={deductions}
                            periodsList={periodsList}
                            takenPeriods={takenPeriods}
                            availableYears={availableYears}
                            allEmployees={allEmployees}
                            filters={filters}
                            pagination={deductionPagination}
                            allClothingAllowances={allClothingAllowances}
                            allClaimsGrouped={allClaimsGrouped}
                            allAdjustmentsGrouped={allAdjustmentsGrouped}
                        />
                    </TabsContent>
                    <TabsContent value="claims" className="mt-0 outline-none">
                        <EmployeeClaims
                            employee={employee}
                            claims={claims}
                            claimTypes={claimTypes}
                            availableYears={availableClaimYears}
                            filters={claimFilters}
                        />
                    </TabsContent>
                    <TabsContent value="adjustments" className="mt-0 outline-none">
                        <EmployeeAdjustments employee={employee} adjustments={adjustments} statistics={adjustmentStatistics} />
                    </TabsContent>
                    <TabsContent value="reports" className="mt-0 outline-none">
                        <Reports employee={employee} allDeductions={allDeductions} allClaims={allClaims} adjustments={adjustments} />
                    </TabsContent>
                    <TabsContent value="settings" className="mt-0 outline-none">
                        <EmployeeSettings employee={employee} employmentStatuses={employmentStatuses} offices={offices} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
