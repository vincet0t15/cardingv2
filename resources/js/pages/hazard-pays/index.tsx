import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { History, PlusIcon, Printer, Search, User } from 'lucide-react';
import { useState } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Dynamic year range: fixed start year (2020) to current year + 5
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

    // Calculate statistics
    const totalEmployees = employees.total;
    const employeesWithHazard = employees.data.filter((e) => e.latest_hazard_pay).length;
    const totalHazard = employees.data.reduce((sum, e) => sum + Number(e.latest_hazard_pay?.amount || 0), 0);
    const averageHazard = employeesWithHazard > 0 ? totalHazard / employeesWithHazard : 0;
    const highestHazard = Math.max(...employees.data.map((e) => Number(e.latest_hazard_pay?.amount || 0)));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hazard Pay" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Heading title="Hazard Pay" description="Manage hazard pay records for employees." />
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
                            <p className="mb-1 font-semibold">How to manage Hazard Pay:</p>
                            <p className="text-teal-700 dark:text-teal-400">
                                Click on an employee's avatar to view their complete details. Use the action buttons to add hazard pay records or view
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

                <div className="bg-card overflow-x-auto overflow-y-hidden rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="min-w-[200px]">Employee</TableHead>
                                <TableHead className="min-w-[140px]">Current Hazard Pay</TableHead>
                                <TableHead className="min-w-[150px]">Effective Date</TableHead>
                                <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-8 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <User className="text-muted-foreground h-12 w-12" />
                                            <p className="text-muted-foreground">No employees with hazard pay found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.data.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage alt={`${employee.first_name} ${employee.last_name}`} />
                                                    <AvatarFallback>
                                                        {employee.first_name[0]}
                                                        {employee.last_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {employee.first_name} {employee.last_name}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">{employee.employment_status?.name}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {employee.latest_hazard_pay ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{formatCurrency(Number(employee.latest_hazard_pay.amount))}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {employee.latest_hazard_pay?.effective_date
                                                ? new Date(employee.latest_hazard_pay.effective_date).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={route('employees.show', employee.id)}>
                                                    <Button variant="outline" size="sm">
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link href={route('hazard-pays.history', employee.id)}>
                                                    <Button variant="outline" size="sm">
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button size="sm" onClick={() => handleOpenAdd(employee)}>
                                                    <PlusIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination data={employees} />
            </div>

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
                        <div>
                            <Label htmlFor="effective_date">Effective Date</Label>
                            <Input
                                id="effective_date"
                                type="date"
                                value={hazardPayData.effective_date}
                                onChange={(e) => setHazardPayData('effective_date', e.target.value)}
                            />
                            {errors.effective_date && <p className="mt-1 text-sm text-red-500">{errors.effective_date}</p>}
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
