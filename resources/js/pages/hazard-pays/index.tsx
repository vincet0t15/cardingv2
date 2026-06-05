import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { EllipsisVertical, HardHat, History, Plus, PlusIcon, Printer, Search, TrendingUp, User } from 'lucide-react';
import { useState } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const currentYear = new Date().getFullYear();
const startYear = 2020;
const endYear = currentYear + 5;
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Hazard Pay',
        href: '/hazard-pays',
    },
];

interface HazardPaysProps {
    employees: PaginatedDataResponse<Employee>;
    offices: Office[];
    employmentStatuses: EmploymentStatus[];
    filters: FilterProps & { office_id?: string; employment_status_id?: string; month?: string; year?: string };
}

export default function HazardPaysIndex({ employees, offices, employmentStatuses, filters }: HazardPaysProps) {
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
        data: hazardPayData,
        setData: setHazardPayData,
        post,
        reset,
        errors,
    } = useForm({
        employee_id: 0,
        amount: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '' as string | undefined,
    });

    const officeOptions = offices.map((o) => ({ value: o.id.toString(), label: o.name }));
    const employmentStatusOptions = employmentStatuses.map((s) => ({ value: s.id.toString(), label: s.name }));

    const applyFilters = (overrides?: Partial<typeof filterData>) => {
        const merged = { ...filterData, ...overrides };
        const queryString: Record<string, string> = {};
        if (merged.search) queryString.search = merged.search;
        if (merged.office_id) queryString.office_id = merged.office_id;
        if (merged.employment_status_id) queryString.employment_status_id = merged.employment_status_id;
        if (merged.month && merged.year) {
            queryString.month = merged.month;
            queryString.year = merged.year;
        }
        router.get(route('hazard-pays.index'), queryString, {
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
        window.open(`/hazard-pays/print?${params.toString()}`, '_blank');
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    };

    const handleOpenAdd = (employee: Employee) => {
        setSelectedEmployee(employee);
        setHazardPayData('employee_id', employee.id);
        setOpenAdd(true);
    };

    const handleAddHazardPay = () => {
        post(route('hazard-pays.store'), {
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

    // Statistics
    const totalEmployees = employees.total;
    const employeesWithHazard = employees.data.filter((e) => e.latest_hazard_pay).length;
    const totalHazard = employees.data.reduce((sum, e) => sum + Number(e.latest_hazard_pay?.amount || 0), 0);
    const averageHazard = employeesWithHazard > 0 ? totalHazard / employeesWithHazard : 0;
    const highestHazard = Math.max(...employees.data.map((e) => Number(e.latest_hazard_pay?.amount || 0)));

    // Helper to format date range
    const formatDateRange = (start: string | null | undefined, end: string | null | undefined) => {
        if (!start) return '-';
        const startDate = new Date(start).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
        const endDate = end
            ? new Date(end).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Present';
        return `${startDate} — ${endDate}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hazard Pay" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto rounded-xl p-4">
                <Heading title="Hazard Pay" description="Manage hazard pay records for employees." />

                {/* Summary Cards */}
                <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-0 bg-gradient-to-br from-indigo-600 to-sky-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <User className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatNumber(totalEmployees)}</div>
                            <p className="text-sm opacity-90">{employeesWithHazard} with Hazard Pay</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-yellow-500 to-amber-500 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Hazard Pay</CardTitle>
                            <HardHat className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatCurrency(totalHazard)}</div>
                            <p className="text-sm opacity-90">Monthly total</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Average Hazard Pay</CardTitle>
                            <HardHat className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatCurrency(averageHazard)}</div>
                            <p className="text-sm opacity-90">Per employee</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
                        <CardHeader className="flex items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Highest Hazard Pay</CardTitle>
                            <TrendingUp className="h-5 w-5 opacity-90" />
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-3xl font-extrabold">{formatCurrency(highestHazard)}</div>
                            <p className="text-sm opacity-90">Maximum</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Instruction Note */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                    <div className="flex items-start gap-3">
                        <HardHat className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="mb-1 font-semibold">How to manage Hazard Pay:</p>
                            <p className="text-amber-700 dark:text-amber-400">
                                Click an employee's name or avatar to view their full profile. Use the{' '}
                                <History className="inline-block h-3.5 w-3.5 align-text-bottom" /> History button to see all hazard pay records for an
                                employee, or the <PlusIcon className="inline-block h-3.5 w-3.5 align-text-bottom" /> Add button to create a new record.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
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

                        <Button variant="outline" onClick={handlePrint} className="transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20">
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-hidden rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary w-[420px] font-bold">Employee</TableHead>
                                <TableHead className="text-primary font-bold">Hazard Pay</TableHead>
                                <TableHead className="text-primary font-bold">Coverage Period</TableHead>
                                <TableHead className="text-primary text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {employees.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-12">
                                        <div className="flex flex-col items-center gap-3">
                                            <HardHat className="text-muted-foreground h-16 w-16" />
                                            <p className="text-muted-foreground text-lg font-semibold">No hazard pay records found.</p>
                                            <p className="text-muted-foreground text-sm">
                                                {filterData.search ? 'Try adjusting your search or filters' : 'Assign hazard pay to employees to see them here.'}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.data.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={route('employees.show', employee.id)}
                                                    className="group relative cursor-pointer"
                                                    title={`View details of ${employee.first_name} ${employee.last_name}`}
                                                >
                                                    <Avatar className="h-12 w-12 border-2 border-slate-200 shadow-sm transition-all hover:border-amber-400 hover:shadow-md dark:border-slate-700 dark:hover:border-amber-500">
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
                                                <Link
                                                    href={route('employees.show', employee.id)}
                                                    className="flex flex-col transition-colors hover:text-amber-600 dark:hover:text-amber-400"
                                                >
                                                    <span className="font-bold uppercase leading-tight">
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name ?? ''}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">{employee.position ?? ''}</span>
                                                    <span className="text-muted-foreground text-xs">{employee.office?.name ?? 'N/A'}</span>
                                                    <Badge variant="outline" className="mt-0.5 w-fit border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                                                        {employee.employment_status?.name ?? 'N/A'}
                                                    </Badge>
                                                </Link>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {employee.latest_hazard_pay ? (
                                                <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                                    {formatCurrency(Number(employee.latest_hazard_pay.amount))}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {employee.latest_hazard_pay
                                                ? formatDateRange(employee.latest_hazard_pay.start_date, employee.latest_hazard_pay.end_date)
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <EllipsisVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.get(route('employees.show', employee.id))}>
                                                        <User className="h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.get(route('hazard-pays.history', employee.id))}>
                                                        <History className="h-4 w-4" /> History
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenAdd(employee)}>
                                                        <Plus className="h-4 w-4" /> Add Record
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination data={employees} />

                <div className="text-muted-foreground text-sm">
                    Showing {employees.data.length} of {employees.total} employee{employees.total !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Add Hazard Pay Dialog */}
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Hazard Pay</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Employee</Label>
                            <Input value={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''} disabled />
                        </div>
                        <div>
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={hazardPayData.amount}
                                onChange={(e) => setHazardPayData('amount', e.target.value)}
                            />
                            {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={hazardPayData.start_date}
                                    onChange={(e) => setHazardPayData('start_date', e.target.value)}
                                />
                                {errors.start_date && <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>}
                            </div>
                            <div>
                                <Label htmlFor="end_date">End Date (Optional)</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={hazardPayData.end_date || ''}
                                    onChange={(e) => setHazardPayData('end_date', e.target.value || undefined)}
                                />
                                {errors.end_date && <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenAdd(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddHazardPay}>Add Hazard Pay</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
