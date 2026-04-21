import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import type { Office } from '@/types/office';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Printer, Search, TrendingDown, User } from 'lucide-react';
import { useEffect, useState } from 'react';

const MONTHS = [
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
const currentYear = new Date().getFullYear();
const startYear = 2020; // Fixed starting year
const endYear = currentYear + 5; // Always extends 5 years into the future
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    return { value: String(year), label: String(year) };
});

interface Salary {
    id: number;
    amount: number;
    effective_date: string;
}

interface DeductionType {
    id: number;
    name: string;
}

interface EmployeeDeduction {
    id: number;
    amount: number;
    deduction_type?: DeductionType;
}

interface IndexProps {
    employees: {
        id: number;
        first_name: string;
        middle_name: string;
        last_name: string;
        suffix: string;
        image_path?: string;
        position: string;
        employment_status: EmploymentStatus | null;
        office: Office | null;
        salaries: Salary[];
        employee_deductions?: EmployeeDeduction[];
    }[];
    offices: Office[];
    employmentStatuses: EmploymentStatus[];
    filters: {
        month: number;
        year: number;
        office_id: number | null;
        employment_status_id: number | null;
        search: string | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Employee Deductions', href: '/employee-deductions' }];

export default function Index({ employees, offices, employmentStatuses, filters }: IndexProps) {
    const { url } = usePage();

    // Get initial filters from URL or defaults
    const getInitialFilters = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            search: urlParams.get('search') || filters.search || '',
            month: urlParams.get('month') || String(filters.month || ''),
            year: urlParams.get('year') || String(filters.year || new Date().getFullYear()),
            office_id: urlParams.get('office_id') || (filters.office_id ? String(filters.office_id) : 'all'),
            employment_status_id:
                urlParams.get('employment_status_id') || (filters.employment_status_id ? String(filters.employment_status_id) : 'all'),
        };
    };

    const [search, setSearch] = useState(getInitialFilters().search);
    const [selectedMonth, setSelectedMonth] = useState(getInitialFilters().month);
    const [selectedYear, setSelectedYear] = useState(getInitialFilters().year);
    const [selectedOffice, setSelectedOffice] = useState(getInitialFilters().office_id);
    const [selectedEmploymentStatus, setSelectedEmploymentStatus] = useState(getInitialFilters().employment_status_id);

    // Auto-apply filters when they change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [selectedMonth, selectedYear, selectedOffice, selectedEmploymentStatus, search]);

    const applyFilters = () => {
        const queryString: Record<string, string | null> = {
            search: search || null,
            month: selectedMonth || null,
            year: selectedYear || null,
            office_id: selectedOffice === 'all' ? null : selectedOffice,
            employment_status_id: selectedEmploymentStatus === 'all' ? null : selectedEmploymentStatus,
        };

        // Update URL
        const url = new URL(window.location.href);
        if (queryString.search) url.searchParams.set('search', queryString.search);
        else url.searchParams.delete('search');
        if (queryString.month) url.searchParams.set('month', queryString.month);
        else url.searchParams.delete('month');
        if (queryString.year) url.searchParams.set('year', queryString.year);
        else url.searchParams.delete('year');
        if (queryString.office_id) url.searchParams.set('office_id', queryString.office_id);
        else url.searchParams.delete('office_id');
        if (queryString.employment_status_id) url.searchParams.set('employment_status_id', queryString.employment_status_id);
        else url.searchParams.delete('employment_status_id');

        window.history.pushState({}, '', url.toString());

        router.get(route('employee-deductions.index'), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedMonth('');
        setSelectedYear(String(new Date().getFullYear()));
        setSelectedOffice('all');
        setSelectedEmploymentStatus('all');
    };

    const getLatestSalary = (salary: Salary | undefined) => {
        return salary?.amount || 0;
    };

    const getTotalDeductions = (deductions: any[]) => {
        return deductions?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
    };

    const getDeductionMonths = (deductions: any[]) => {
        if (!deductions || deductions.length === 0) return [];

        // Get unique months from deductions
        const uniqueMonths = [...new Set(deductions.map((d) => d.pay_period_month))];
        return uniqueMonths;
    };

    const getMonthLabel = (monthNumber: number) => {
        const month = MONTHS.find((m) => m.value === String(monthNumber));
        return month ? month.label : 'Unknown';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-PH').format(num);
    };

    // Calculate statistics
    const totalEmployees = employees.length;
    const employeesWithDeductions = employees.filter((e) => (e.employee_deductions?.length || 0) > 0).length;
    const totalDeductionsAll = employees.reduce((sum, e) => sum + getTotalDeductions(e.employee_deductions as any[]), 0);
    const averageDeduction = employeesWithDeductions > 0 ? totalDeductionsAll / employeesWithDeductions : 0;
    const highestDeduction = Math.max(...employees.map((e) => getTotalDeductions(e.employee_deductions as any[])));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Deductions" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Employee Deductions" description="Manage employee deductions for payroll processing." />

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
                    <Card className="border-0 bg-gradient-to-br from-indigo-600 to-sky-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Employees</CardTitle>
                            <User className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">{formatNumber(totalEmployees)}</div>
                            <p className="text-sm opacity-90">{employeesWithDeductions} with deductions</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
                            <TrendingDown className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-amber-50">{formatCurrency(totalDeductionsAll)}</div>
                            <p className="text-sm opacity-90">Monthly total</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Average</CardTitle>
                            <TrendingDown className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">{formatCurrency(averageDeduction)}</div>
                            <p className="text-sm opacity-90">Per employee</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Highest</CardTitle>
                            <TrendingDown className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">{formatCurrency(highestDeduction)}</div>
                            <p className="text-sm opacity-90">Maximum deduction</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Instruction Note */}
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-teal-800 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-300 mt-3">
                    <div className="flex items-start gap-3">
                        <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <div className="text-sm">
                            <p className="mb-1 font-semibold">How to manage deductions:</p>
                            <p className="text-teal-700 dark:text-teal-400">Click an employee's avatar or row to view their details and manage deductions.</p>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="w-[220px]">
                            <CustomComboBox
                                items={[
                                    { value: 'all', label: 'All Offices' },
                                    ...offices.map((office) => ({ value: office.id.toString(), label: office.name })),
                                ]}
                                placeholder="All Offices"
                                value={selectedOffice}
                                onSelect={(value) => setSelectedOffice(value || 'all')}
                            />
                        </div>

                        <div className="w-[200px]">
                            <CustomComboBox
                                items={[
                                    { value: 'all', label: 'All Statuses' },
                                    ...employmentStatuses.map((status) => ({ value: status.id.toString(), label: status.name })),
                                ]}
                                placeholder="All Statuses"
                                value={selectedEmploymentStatus}
                                onSelect={(value) => setSelectedEmploymentStatus(value || 'all')}
                            />
                        </div>

                        <div className="w-[150px]">
                            <CustomComboBox
                                items={[{ value: '', label: 'All Months' }, ...MONTHS]}
                                placeholder="All Months"
                                value={selectedMonth}
                                onSelect={(value) => setSelectedMonth(value || '')}
                            />
                        </div>

                        <div className="w-[120px]">
                            <CustomComboBox
                                items={YEARS}
                                placeholder="Year"
                                value={selectedYear}
                                onSelect={(value) => setSelectedYear(value || '')}
                            />
                        </div>

                        <div className="relative w-full sm:w-[250px]">
                            <Label htmlFor="search" className="sr-only">
                                Search
                            </Label>
                            <Input
                                id="search"
                                placeholder="Search employee..."
                                className="w-full pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (selectedMonth) params.append('month', selectedMonth);
                                if (selectedYear) params.append('year', selectedYear);
                                if (selectedOffice !== 'all') params.append('office_id', selectedOffice);
                                if (selectedEmploymentStatus !== 'all') params.append('employment_status_id', selectedEmploymentStatus);
                                window.open(route('employee-deductions.print') + '?' + params.toString(), '_blank');
                            }}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            Reset
                        </Button>
                    </div>
                </div>

                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary w-[500px] font-bold">Employee</TableHead>
                                <TableHead className="text-primary font-bold">Pay Period</TableHead>
                                <TableHead className="text-primary text-right font-bold">Monthly Salary</TableHead>
                                <TableHead className="text-primary text-right font-bold">Total Deductions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {employees.length > 0 ? (
                                employees.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('manage.employees.index', employee.id)}
                                                    className="group relative cursor-pointer"
                                                    title={`View details of ${employee.first_name} ${employee.last_name}`}
                                                >
                                                    <Avatar className="h-12 w-12 border-2 border-slate-200 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-slate-700 dark:hover:border-blue-500">
                                                        {employee.image_path ? (
                                                            <AvatarImage
                                                                src={employee.image_path ?? undefined}
                                                                alt={`${employee.first_name} ${employee.last_name}`}
                                                                className="object-cover"
                                                            />
                                                        ) : null}
                                                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                                                            <User className="h-5 w-5 text-slate-400" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </Link>
                                                <div className="flex flex-col">
                                                    <span className="font-bold uppercase">
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">{employee.position}</span>
                                                    <span className="text-muted-foreground text-xs">{employee.office?.name || 'N/A'}</span>
                                                    <Badge variant="outline" className="bg-teal-800 text-white">
                                                        {employee.employment_status?.name}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const deductionMonths = getDeductionMonths(employee.employee_deductions as any[]);

                                                if (deductionMonths.length === 0) {
                                                    return (
                                                        <Badge variant="outline" className="text-gray-400">
                                                            No deductions
                                                        </Badge>
                                                    );
                                                }

                                                // If only one month, show it
                                                if (deductionMonths.length === 1) {
                                                    return (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                                        >
                                                            {getMonthLabel(deductionMonths[0])} {selectedYear}
                                                        </Badge>
                                                    );
                                                }

                                                // If multiple months, show count
                                                return (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {deductionMonths.length} months
                                                    </Badge>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(getLatestSalary(employee.salaries?.[0]))}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(getTotalDeductions(employee.employee_deductions as any[]))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <TrendingDown className="mb-3 h-16 w-16 text-gray-300 dark:text-gray-600" />
                                            <p className="text-muted-foreground text-lg font-semibold">No employees found</p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {search ? 'Try adjusting your search' : 'No employees with deductions'}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="text-muted-foreground text-sm">
                    Showing {employees.length} employee{employees.length !== 1 ? 's' : ''}
                </div>
            </div>
        </AppLayout>
    );
}
