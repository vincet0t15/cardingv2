import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Employee } from '@/types/employee';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import type { FilterProps } from '@/types/filter';
import type { Office } from '@/types/office';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { CreditCard, History, PlusIcon, Printer, Search, TrendingUp, User } from 'lucide-react';
import { useState } from 'react';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Dynamic year range: fixed start year (2020) to current year + 5
const currentYear = new Date().getFullYear();
const startYear = 2020;
const endYear = currentYear + 5;
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'PERA',
        href: '/peras',
    },
];

interface PerasProps {
    employees: PaginatedDataResponse<Employee>;
    offices: Office[];
    employmentStatuses: EmploymentStatus[];
    filters: FilterProps & { office_id?: string; employment_status_id?: string; month?: string; year?: string };
}

export default function PerasIndex({ employees, offices, employmentStatuses, filters }: PerasProps) {
    const { data: filterData, setData: setFilterData } = useForm({
        search: filters.search || '',
        office_id: filters.office_id || '',
        employment_status_id: filters.employment_status_id || '',
        month: filters.month || '',
        year: filters.year || '',
    });

    const [openAdd, setOpenAdd] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const {
        data: peraData,
        setData: setPeraData,
        post,
        reset,
        errors,
    } = useForm({
        employee_id: 0,
        amount: '',
        effective_date: new Date().toISOString().split('T')[0],
    });

    const officeOptions = offices.map((o) => ({ value: o.id.toString(), label: o.name }));
    const employmentStatusOptions = employmentStatuses.map((s) => ({ value: s.id.toString(), label: s.name }));

    const applyFilters = (overrides?: Partial<typeof filterData>) => {
        const merged = { ...filterData, ...overrides };
        const queryString: Record<string, string> = {};
        if (merged.search) queryString.search = merged.search;
        if (merged.office_id) queryString.office_id = merged.office_id;
        if (merged.employment_status_id) queryString.employment_status_id = merged.employment_status_id;
        // Only include month/year if BOTH are provided
        if (merged.month && merged.year) {
            queryString.month = merged.month;
            queryString.year = merged.year;
        }
        router.get(route('peras.index'), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleMonthChange = (value: string) => {
        const newMonth = value || '';
        setFilterData('month', newMonth);
        applyFilters({ month: newMonth });
    };

    const handleYearChange = (value: string) => {
        const newYear = value || '';
        setFilterData('year', newYear);
        applyFilters({ year: newYear });
    };

    const handleOfficeChange = (value: string) => {
        const newOfficeId = value || '';
        setFilterData('office_id', newOfficeId);
        applyFilters({ office_id: newOfficeId });
    };

    const handleEmploymentStatusChange = (value: string) => {
        const newStatusId = value || '';
        setFilterData('employment_status_id', newStatusId);
        applyFilters({ employment_status_id: newStatusId });
    };

    const handlePrint = () => {
        const params = new URLSearchParams();
        if (filterData.month) params.append('month', filterData.month);
        if (filterData.year) params.append('year', filterData.year);
        window.open(`/peras/print?${params.toString()}`, '_blank');
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    };

    const handleOpenAdd = (employee: Employee) => {
        setSelectedEmployee(employee);
        setPeraData('employee_id', employee.id);
        setOpenAdd(true);
    };

    const handleAddPera = () => {
        post(route('peras.store'), {
            onSuccess: () => {
                reset();
                setOpenAdd(false);
                setSelectedEmployee(null);
            },
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

    // Calculate statistics
    const totalEmployees = employees.total;
    const employeesWithPera = employees.data.filter((e) => e.latest_pera).length;
    const totalPera = employees.data.reduce((sum, e) => sum + Number(e.latest_pera?.amount || 0), 0);
    const averagePera = employeesWithPera > 0 ? totalPera / employeesWithPera : 0;
    const highestPera = Math.max(...employees.data.map((e) => Number(e.latest_pera?.amount || 0)));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="PERA" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Personnel Economic Relief Allowance (PERA)" description="Manage employee PERA records with history tracking." />

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
                    <Card className="border-0 bg-gradient-to-br from-indigo-600 to-sky-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <User className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">{formatNumber(totalEmployees)}</div>
                            <p className="text-sm opacity-90">{employeesWithPera} with PERA</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total PERA</CardTitle>
                            <CreditCard className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">{formatCurrency(totalPera)}</div>
                            <p className="text-sm opacity-90">Monthly total</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Average PERA</CardTitle>
                            <CreditCard className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">{formatCurrency(averagePera)}</div>
                            <p className="text-sm opacity-90">Per employee</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Highest PERA</CardTitle>
                            <TrendingUp className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">{formatCurrency(highestPera)}</div>
                            <p className="text-sm opacity-90">Maximum</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Instruction Note */}
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-teal-800 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-300">
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
                            <p className="mb-1 font-semibold">How to manage PERA:</p>
                            <p className="text-teal-700 dark:text-teal-400">
                                Click on an employee's avatar to view their complete details. Use the action buttons to add PERA records or view
                                history.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="w-[180px]">
                            <CustomComboBox
                                items={MONTHS.map((month, index) => ({ value: String(index + 1), label: month }))}
                                placeholder="All Months"
                                value={filterData.month || null}
                                onSelect={(value) => handleMonthChange(value ?? '')}
                            />
                        </div>

                        <div className="w-[140px]">
                            <CustomComboBox
                                items={YEARS.map((year) => ({ value: String(year), label: String(year) }))}
                                placeholder="All Years"
                                value={filterData.year || null}
                                onSelect={(value) => handleYearChange(value ?? '')}
                            />
                        </div>

                        <div className="w-[220px]">
                            <CustomComboBox
                                items={officeOptions}
                                placeholder="All Offices"
                                value={filterData.office_id || null}
                                onSelect={(value) => handleOfficeChange(value ?? '')}
                            />
                        </div>

                        <div className="w-[200px]">
                            <CustomComboBox
                                items={employmentStatusOptions}
                                placeholder="All Status"
                                value={filterData.employment_status_id || null}
                                onSelect={(value) => handleEmploymentStatusChange(value ?? '')}
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
                                value={filterData.search}
                                onChange={(e) => setFilterData('search', e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
                        </div>

                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary w-[500px] font-bold">Employee</TableHead>
                                <TableHead className="text-primary text-right font-bold">Current PERA</TableHead>
                                <TableHead className="text-primary w-[150px] text-center font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {employees.data.length > 0 ? (
                                employees.data.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link href={route('manage.employees.index', employee.id)} className="group relative cursor-pointer">
                                                    <Avatar className="h-12 w-12 border-2 border-slate-200 shadow-sm transition-all hover:border-teal-400 hover:shadow-md dark:border-slate-700 dark:hover:border-teal-500">
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
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name} {employee.suffix}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">{employee.position}</span>
                                                    <span className="text-muted-foreground text-xs">{employee.office?.name}</span>
                                                    <Badge variant="outline" className="bg-teal-800 text-white">
                                                        {employee.employment_status?.name}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right font-medium">
                                            {employee.latest_pera ? formatCurrency(employee.latest_pera.amount) : '-'}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30"
                                                    onClick={() => router.get(route('peras.history', employee.id))}
                                                    title="View PERA History"
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-teal-600 transition-colors hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900/30"
                                                    onClick={() => handleOpenAdd(employee)}
                                                    title="Add PERA Record"
                                                >
                                                    <PlusIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <CreditCard className="mb-3 h-16 w-16 text-gray-300 dark:text-gray-600" />
                                            <p className="text-muted-foreground text-lg font-semibold">No employees found</p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {filterData.search ? 'Try adjusting your search' : 'No employees available'}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination data={employees} />

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                {/* Add PERA Dialog */}
                <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add PERA Record</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Employee</Label>
                                <div className="text-lg font-medium">
                                    {selectedEmployee?.last_name}, {selectedEmployee?.first_name} {selectedEmployee?.middle_name}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (PHP)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={peraData.amount}
                                    onChange={(e) => setPeraData('amount', e.target.value)}
                                    placeholder="0.00"
                                />
                                {errors.amount && <p className="text-destructive text-sm">{errors.amount}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="effective_date">Effective Date</Label>
                                <Input
                                    id="effective_date"
                                    type="date"
                                    value={peraData.effective_date}
                                    onChange={(e) => setPeraData('effective_date', e.target.value)}
                                />
                                {errors.effective_date && <p className="text-destructive text-sm">{errors.effective_date}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenAdd(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddPera}>Add PERA</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
