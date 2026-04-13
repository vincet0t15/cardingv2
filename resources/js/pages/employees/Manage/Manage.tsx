import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';

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
import { ArrowLeft, CoinsIcon, FileText, LayoutDashboard, Receipt, Settings, TrendingDown } from 'lucide-react';

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
    totalDeductionsAllTime?: number;
    totalClaimsAllTime?: number;
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
    totalDeductionsAllTime = 0,
    totalClaimsAllTime = 0,
}: EmployeeManageProps) {
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
        return `${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}`;
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
                <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div className="flex items-center gap-5">
                        <Avatar className="border-background h-24 w-24 rounded-2xl border-4 shadow-xl">
                            <AvatarImage src={employee.image_path} alt={employee.last_name} className="object-cover" />
                            <AvatarFallback className="rounded-2xl bg-slate-100 text-xl">{getInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">
                                    {employee.last_name}, {employee.first_name} {employee.middle_name} {employee.suffix}
                                </h1>
                                <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                                    {employee.employment_status?.name}
                                </Badge>
                            </div>
                            <p className="flex items-center gap-2 font-medium text-slate-500">
                                {employee.position} <span className="text-slate-300">•</span> {employee.office?.name}
                            </p>
                            <div className="pt-1">
                                <span className="text-2xl font-bold text-slate-900">{formatCurrency(employee.latest_salary?.amount)}</span>
                                <span className="ml-1 text-sm text-slate-500">/ month</span>
                            </div>
                        </div>
                    </div>
                </header>

                <Separator className="bg-slate-200/60" />

                {/* --- TABS SECTION --- */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <div className="flex items-center justify-between overflow-x-auto pb-1">
                        <TabsList>
                            <TabsTrigger value="overview">
                                <LayoutDashboard className="h-4 w-4" /> Overview
                            </TabsTrigger>
                            <TabsTrigger value="compensation">
                                <CoinsIcon className="h-4 w-4" /> Compensation
                            </TabsTrigger>
                            <TabsTrigger value="deductions">
                                <TrendingDown className="h-4 w-4" /> Deductions
                            </TabsTrigger>
                            <TabsTrigger value="claims">
                                <Receipt className="h-4 w-4" /> Claims
                            </TabsTrigger>
                            <TabsTrigger value="reports">
                                <FileText className="h-4 w-4" /> Reports
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                <Settings className="h-4 w-4" /> Settings
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
                    <TabsContent value="reports" className="mt-0 outline-none">
                        <Reports employee={employee} allDeductions={allDeductions} allClaims={allClaims} />
                    </TabsContent>
                    <TabsContent value="settings" className="mt-0 outline-none">
                        <EmployeeSettings employee={employee} employmentStatuses={employmentStatuses} offices={offices} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
