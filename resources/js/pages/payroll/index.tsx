import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import type { Office } from '@/types/office';
import type { PaginatedDataResponse } from '@/types/pagination';
import type { PayrollEmployee } from '@/types/payroll';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Coins, MinusCircle, Printer, Search, User, Wallet } from 'lucide-react';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: '/payroll',
    },
];

const MONTHS = [
    { value: 0, label: 'All Months' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

// Dynamic year range: fixed start year (2020) to current year + 5
const currentYear = new Date().getFullYear();
const startYear = 2020;
const endYear = currentYear + 5;
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => ({
    value: String(startYear + i),
    label: String(startYear + i),
}));

interface PayrollIndexProps {
    employees: PaginatedDataResponse<PayrollEmployee>;
    offices: Office[];
    employmentStatuses: EmploymentStatus[];
    filters: {
        month: number;
        year: number;
        office_id?: number;
        employment_status_id?: number;
        search?: string;
    };
}

export default function PayrollIndex({ employees, offices, employmentStatuses, filters }: PayrollIndexProps) {
    const { url } = usePage();

    // Get initial filters from URL or defaults
    const getInitialFilters = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            month: urlParams.get('month') || String(filters.month || 0),
            year: urlParams.get('year') || String(filters.year || currentYear),
            office_id: urlParams.get('office_id') || (filters.office_id ? String(filters.office_id) : ''),
            employment_status_id: urlParams.get('employment_status_id') || (filters.employment_status_id ? String(filters.employment_status_id) : ''),
            search: urlParams.get('search') || filters.search || '',
        };
    };

    const { data: filterData, setData: setFilterData } = useForm({
        month: getInitialFilters().month,
        year: getInitialFilters().year,
        office_id: getInitialFilters().office_id,
        employment_status_id: getInitialFilters().employment_status_id,
        search: getInitialFilters().search,
    });

    const officeOptions = offices.map((office) => ({
        value: office.id.toString(),
        label: office.name,
    }));

    const employmentStatusOptions = employmentStatuses.map((s) => ({
        value: s.id.toString(),
        label: s.name,
    }));

    const monthOptions = MONTHS.map((m) => ({
        value: m.value.toString(),
        label: m.label,
    }));

    // Auto-apply filters when they change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [filterData.month, filterData.year, filterData.office_id, filterData.employment_status_id, filterData.search]);

    const applyFilters = () => {
        const queryString: Record<string, string | null> = {
            month: filterData.month || null,
            year: filterData.year || null,
            office_id: filterData.office_id || null,
            employment_status_id: filterData.employment_status_id || null,
            search: filterData.search || null,
        };

        // Update URL
        const url = new URL(window.location.href);
        if (queryString.month && queryString.month !== '0') url.searchParams.set('month', queryString.month);
        else url.searchParams.delete('month');
        if (queryString.year) url.searchParams.set('year', queryString.year);
        else url.searchParams.delete('year');
        if (queryString.office_id) url.searchParams.set('office_id', queryString.office_id);
        else url.searchParams.delete('office_id');
        if (queryString.employment_status_id) url.searchParams.set('employment_status_id', queryString.employment_status_id);
        else url.searchParams.delete('employment_status_id');
        if (queryString.search) url.searchParams.set('search', queryString.search);
        else url.searchParams.delete('search');

        window.history.pushState({}, '', url.toString());

        router.get(route('payroll.index'), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

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

    const getMonthName = (month: number) => {
        if (month === 0) return 'All Months';
        return MONTHS.find((m) => m.value === month)?.label || '';
    };

    const getTotalSalary = () => employees.data.reduce((sum, e) => sum + Number(e.current_salary), 0);
    const getTotalPera = () => employees.data.reduce((sum, e) => sum + Number(e.current_pera), 0);
    const getTotalRata = () => employees.data.reduce((sum, e) => sum + Number(e.current_rata), 0);
    const getTotalHazardPay = () => employees.data.reduce((sum, e) => sum + Number(e.current_hazard_pay || 0), 0);
    const getTotalClothingAllowance = () => employees.data.reduce((sum, e) => sum + Number(e.current_clothing_allowance || 0), 0);
    const getTotalGross = () => employees.data.reduce((sum, e) => sum + Number(e.gross_pay), 0);
    const getTotalDeductions = () => employees.data.reduce((sum, e) => sum + Number(e.total_deductions), 0);
    const getTotalNet = () => employees.data.reduce((sum, e) => sum + Number(e.net_pay), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Summary" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Payroll Summary"
                    description={
                        filters.month === 0
                            ? `View payroll summary for all months in ${filters.year}`
                            : `View payroll summary for ${getMonthName(filters.month)} ${filters.year}`
                    }
                />

                {/* Filters */}
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="w-[150px]">
                            <CustomComboBox
                                items={monthOptions}
                                placeholder="All Months"
                                value={filterData.month}
                                onSelect={(value) => setFilterData('month', value || '0')}
                            />
                        </div>

                        <div className="w-[120px]">
                            <CustomComboBox
                                items={YEARS}
                                placeholder="Select Year"
                                value={filterData.year}
                                onSelect={(value) => setFilterData('year', value || String(currentYear))}
                            />
                        </div>

                        <div className="w-[220px]">
                            <CustomComboBox
                                items={officeOptions}
                                placeholder="All Offices"
                                value={filterData.office_id || null}
                                onSelect={(value) => setFilterData('office_id', value ?? '')}
                            />
                        </div>

                        <div className="w-[200px]">
                            <CustomComboBox
                                items={employmentStatusOptions}
                                placeholder="All Status"
                                value={filterData.employment_status_id || null}
                                onSelect={(value) => setFilterData('employment_status_id', value ?? '')}
                            />
                        </div>

                        <div className="relative w-full sm:w-[200px]">
                            <Input
                                placeholder="Search employee..."
                                className="pl-8"
                                value={filterData.search}
                                onChange={(e) => setFilterData('search', e.target.value)}
                            />
                            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const query = new URLSearchParams();
                                query.append('month', filterData.month.toString());
                                query.append('year', filterData.year.toString());
                                if (filterData.office_id) query.append('office_id', filterData.office_id);
                                if (filterData.employment_status_id) query.append('employment_status_id', filterData.employment_status_id);
                                window.open(route('payroll.print') + '?' + query.toString(), '_blank');
                            }}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-0 bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Employees</CardTitle>
                            <Wallet className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatNumber(employees.data.length)}</div>
                            <p className="text-sm opacity-90">Employees on this page</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Salaries</CardTitle>
                            <Wallet className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatCurrency(getTotalSalary())}</div>
                            <p className="text-sm opacity-90">Basic pay (sum)</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">PERA</CardTitle>
                            <Coins className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatCurrency(getTotalPera())}</div>
                            <p className="text-sm opacity-90">Personnel Economic Relief Allowance</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-yellow-500 to-amber-500 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">RATA</CardTitle>
                            <Wallet className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatCurrency(getTotalRata())}</div>
                            <p className="text-sm opacity-90">RATA (Regional/Allowance)</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-0 bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Hazard Pay</CardTitle>
                            <MinusCircle className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatCurrency(getTotalHazardPay())}</div>
                            <p className="text-sm opacity-90">Hazard pay total</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Clothing Allowance</CardTitle>
                            <Wallet className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatCurrency(getTotalClothingAllowance())}</div>
                            <p className="text-sm opacity-90">Clothing allowance total</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
                            <MinusCircle className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold text-amber-50">{formatCurrency(getTotalDeductions())}</div>
                            <p className="text-sm opacity-90">Total deductions</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-emerald-700 to-teal-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
                            <Wallet className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold text-green-200">{formatCurrency(getTotalNet())}</div>
                            <p className="text-sm opacity-90">After deductions</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Employee</TableHead>
                                <TableHead className="text-primary text-right font-bold">Salary</TableHead>
                                <TableHead className="text-primary text-right font-bold">PERA</TableHead>
                                <TableHead className="text-primary text-right font-bold">RATA</TableHead>
                                <TableHead className="text-primary text-right font-bold">Hazard Pay</TableHead>
                                <TableHead className="text-primary text-right font-bold">Clothing Allow.</TableHead>
                                <TableHead className="text-primary text-right font-bold">Gross Pay</TableHead>
                                <TableHead className="text-primary text-right font-bold">Deductions</TableHead>
                                <TableHead className="text-primary text-right font-bold">Net Pay</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {employees.data.length > 0 ? (
                                employees.data.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    onClick={() =>
                                                        router.get(
                                                            route('payroll.show', employee.id) + `?month=${filters.month}&year=${filters.year}`,
                                                        )
                                                    }
                                                    className="hover:border-primary h-12 w-12 cursor-pointer border-2 border-slate-200 shadow-sm dark:border-slate-700"
                                                >
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
                                                <div className="flex flex-col">
                                                    <span className="font-bold uppercase">
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">{employee.position}</span>
                                                    <span className="text-muted-foreground text-xs">{employee.office?.name}</span>
                                                    <Badge variant="outline" className="bg-teal-800 text-white">
                                                        {employee.employment_status?.name}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(employee.current_salary)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(employee.current_pera)}</TableCell>
                                        <TableCell className="text-right">
                                            {employee.is_rata_eligible ? formatCurrency(employee.current_rata) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(employee.current_hazard_pay || 0)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(employee.current_clothing_allowance || 0)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(employee.gross_pay)}</TableCell>
                                        <TableCell className="text-right text-red-600">{formatCurrency(employee.total_deductions)}</TableCell>
                                        <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(employee.net_pay)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination data={employees} />
            </div>
        </AppLayout>
    );
}
