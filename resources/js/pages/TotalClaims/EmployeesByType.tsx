import { CustomComboBox } from '@/components/CustomComboBox';
import Pagination from '@/components/paginationData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, FileText, Printer, Receipt, Search, User } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Total Claims',
        href: '/total-claims',
    },
    {
        title: 'Employees',
        href: '#',
    },
];

const months = [
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

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface EmployeeClaim {
    id: number;
    employee_id: number;
    employee_name: string;
    position: string | null;
    office: string;
    employment_status: string;
    claim_count: number;
    total_amount: number;
}

interface Summary {
    total_employees: number;
    total_claims: number;
    total_amount: number;
}

interface EmployeesByClaimTypeProps {
    claim_type: {
        id: number;
        name: string;
        code: string;
    };
    employees: EmployeeClaim[];
    employees_paginated: PaginatedDataResponse<EmployeeClaim>;
    summary: Summary;
    offices: { id: number; name: string }[];
    employment_statuses: { id: number; name: string }[];
    filters: {
        month: string | null;
        year: number | null;
        office_id: string | null;
        employment_status_id: string | null;
        search: string | null;
    };
}

export default function EmployeesByClaimType({
    claim_type,
    employees,
    employees_paginated,
    summary,
    offices,
    employment_statuses,
    filters,
}: EmployeesByClaimTypeProps) {
    const [searchValue, setSearchValue] = useState(filters.search || '');

    const handleFilterChange = (key: string, value: any) => {
        router.get(
            route('total-claims.employees', claim_type.id),
            {
                month: filters.month,
                year: filters.year,
                office_id: filters.office_id,
                employment_status_id: filters.employment_status_id,
                search: filters.search,
                [key]: value || null,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearch = () => {
        handleFilterChange('search', searchValue);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 5;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => ({
        value: (startYear + i).toString(),
        label: (startYear + i).toString(),
    }));

    const officeItems = [{ value: '', label: 'All Offices' }, ...offices.map((o) => ({ value: o.id.toString(), label: o.name }))];
    const employmentStatusItems = [
        { value: '', label: 'All Status' },
        ...employment_statuses.map((s) => ({ value: s.id.toString(), label: s.name })),
    ];

    const getPeriodLabel = () => {
        const monthLabel = filters.month ? months.find((m) => m.value === filters.month)?.label : 'All Months';
        const yearLabel = filters.year || currentYear;
        return `${monthLabel} ${yearLabel}`;
    };

    const getRowNumber = (index: number) => {
        return (employees_paginated.current_page - 1) * employees_paginated.per_page + index + 1;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${claim_type.name} - Employees`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <Button variant="outline" size="sm" className="inline-flex" onClick={() => router.get(route('total-claims.index'), {}, { preserveState: true, preserveScroll: true })}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Total Claims
                    </Button>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{claim_type.name}</h1>
                        <p className="text-muted-foreground mt-1">Employees with {claim_type.name} claims</p>
                    </div>
                    <Button onClick={() => window.open(route('total-claims.employees.print', { claimType: claim_type.id, ...filters }), '_blank')}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Filters
                        </CardTitle>
                        <CardDescription>Filter employees by various criteria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Month</label>
                                <CustomComboBox
                                    items={months}
                                    placeholder="Select month"
                                    value={filters.month || null}
                                    onSelect={(value) => handleFilterChange('month', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Year</label>
                                <CustomComboBox
                                    items={years}
                                    placeholder="Select year"
                                    value={(filters.year || currentYear).toString()}
                                    onSelect={(value) => handleFilterChange('year', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Office</label>
                                <CustomComboBox
                                    items={officeItems}
                                    placeholder="Select office"
                                    value={filters.office_id || null}
                                    onSelect={(value) => handleFilterChange('office_id', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Employment Status</label>
                                <CustomComboBox
                                    items={employmentStatusItems}
                                    placeholder="Select status"
                                    value={filters.employment_status_id || null}
                                    onSelect={(value) => handleFilterChange('employment_status_id', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Search</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Search employee..."
                                        className="pl-8"
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyDown={handleSearchKeyDown}
                                    />
                                    <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <User className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_employees}</div>
                            <p className="text-muted-foreground text-xs">With {claim_type.name} claims</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                            <Receipt className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_claims}</div>
                            <p className="text-muted-foreground text-xs">For {getPeriodLabel()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <FileText className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_amount)}</div>
                            <p className="text-muted-foreground text-xs">Total value</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Employees with {claim_type.name} Claims
                        </CardTitle>
                        <CardDescription>List of employees who submitted {claim_type.name} claims</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {employees.length > 0 ? (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px] text-center">#</TableHead>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Office</TableHead>
                                            <TableHead>Employment Status</TableHead>
                                            <TableHead className="text-right">Claim Count</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employees.map((employee, index) => (
                                            <TableRow key={employee.id} className="hover:bg-muted/50">
                                                <TableCell className="text-center">
                                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {getRowNumber(index)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        type="button"
                                                        className="hover:text-primary flex flex-col items-start text-left hover:underline"
                                                        onClick={() => router.get(route('claims.employee.detail', employee.employee_id))}
                                                    >
                                                        <span className="text-primary font-medium hover:underline">{employee.employee_name}</span>
                                                        <span className="text-muted-foreground text-xs">{employee.position || 'N/A'}</span>
                                                    </button>
                                                </TableCell>
                                                <TableCell>{employee.office}</TableCell>
                                                <TableCell>
                                                    <span className="bg-muted rounded px-2 py-1 text-xs">{employee.employment_status}</span>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">{employee.claim_count}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(employee.total_amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <tfoot>
                                        <TableRow className="bg-muted/50 font-bold">
                                            <TableCell className="text-right" colSpan={4}>
                                                TOTAL:
                                            </TableCell>
                                            <TableCell className="text-right">{summary.total_claims}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(summary.total_amount)}</TableCell>
                                        </TableRow>
                                    </tfoot>
                                </Table>

                                <div className="mt-4">
                                    <Pagination data={employees_paginated} />
                                </div>
                            </>
                        ) : (
                            <div className="py-12 text-center">
                                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <FileText className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-muted-foreground text-sm">No employees found for the selected filters</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}