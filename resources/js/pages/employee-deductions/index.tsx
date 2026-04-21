import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import type { FilterProps } from '@/types/filter';
import type { Office } from '@/types/office';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { Search, User } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Deductions',
        href: '/employee-deductions',
    },
];

const MONTHS = [
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
const startYear = 2020; // Fixed starting year
const endYear = currentYear + 5; // Always extends 5 years into the future
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = startYear + i;
    return { value: year.toString(), label: year.toString() };
});

interface EmployeeDeductionsProps {
    employees: PaginatedDataResponse<Employee>;
    deductionTypes: DeductionType[];
    offices: Office[];
    employmentStatuses: EmploymentStatus[];
    filters: FilterProps & {
        month: number;
        year: number;
        office_id?: string;
        employment_status_id?: string;
        has_deductions?: boolean;
    };
}

export default function EmployeeDeductionsIndex({ employees, deductionTypes, offices, employmentStatuses, filters }: EmployeeDeductionsProps) {
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedDeduction, setSelectedDeduction] = useState<EmployeeDeduction | null>(null);

    // Initialize filters from URL, sessionStorage, or props
    const getInitialFilters = () => {
        const urlParams = new URLSearchParams(window.location.search);

        // Check if there are saved filters in sessionStorage (when coming back from employee page)
        const savedFilters = sessionStorage.getItem('employeeDeductionsFilters');
        if (savedFilters && !urlParams.has('month')) {
            const parsed = JSON.parse(savedFilters);
            // Clear sessionStorage after using it
            sessionStorage.removeItem('employeeDeductionsFilters');
            return parsed;
        }

        // Otherwise use URL params or default filters
        return {
            month: parseInt(urlParams.get('month') || String(filters.month)),
            year: parseInt(urlParams.get('year') || String(filters.year)),
            search: urlParams.get('search') || filters.search || '',
            office_id: urlParams.get('office_id') || filters.office_id || '',
            employment_status_id: urlParams.get('employment_status_id') || filters.employment_status_id || '',
            has_deductions: urlParams.get('has_deductions') === 'false' ? false : (filters.has_deductions ?? true),
        };
    };

    const { data: filterData, setData: setFilterData } = useForm(getInitialFilters());

    const {
        data: addData,
        setData: setAddData,
        post,
        reset,
        errors,
    } = useForm({
        employee_id: 0,
        deduction_type_id: 0,
        amount: '',
        pay_period_month: filters.month,
        pay_period_year: filters.year,
        notes: '',
    });

    const {
        data: editData,
        setData: setEditData,
        put,
        reset: resetEdit,
        errors: editErrors,
    } = useForm({
        amount: '',
        notes: '',
    });

    const officeOptions = offices.map((o) => ({ value: o.id.toString(), label: o.name }));
    const employmentStatusOptions = employmentStatuses.map((s) => ({ value: s.id.toString(), label: s.name }));
    const monthOptions = MONTHS.map((m) => ({ value: m.value.toString(), label: m.label }));
    const deductionTypeOptions = deductionTypes.map((t) => ({ value: t.id.toString(), label: t.name }));

    const handleFilterChange = () => {
        const queryString: Record<string, string | number> = {};
        if (filterData.month) queryString.month = filterData.month;
        if (filterData.year) queryString.year = filterData.year;
        if (filterData.search) queryString.search = filterData.search;
        if (filterData.office_id) queryString.office_id = filterData.office_id;
        if (filterData.employment_status_id) queryString.employment_status_id = filterData.employment_status_id;
        queryString.has_deductions = filterData.has_deductions ? '1' : '0';

        // Update URL with current filters
        const url = new URL(window.location.href);
        url.searchParams.set('month', filterData.month.toString());
        url.searchParams.set('year', filterData.year.toString());
        if (filterData.search) url.searchParams.set('search', filterData.search);
        else url.searchParams.delete('search');
        if (filterData.office_id) url.searchParams.set('office_id', filterData.office_id);
        else url.searchParams.delete('office_id');
        if (filterData.employment_status_id) url.searchParams.set('employment_status_id', filterData.employment_status_id);
        else url.searchParams.delete('employment_status_id');
        url.searchParams.set('has_deductions', filterData.has_deductions.toString());

        // Update browser history
        window.history.pushState({}, '', url.toString());

        router.get(route('employee-deductions.index'), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleAddDeduction = () => {
        post(route('employee-deductions.store'), {
            onSuccess: () => {
                reset();
                setOpenAdd(false);
                setSelectedEmployee(null);
            },
        });
    };

    const handleOpenEdit = (deduction: EmployeeDeduction, employee: Employee) => {
        setSelectedEmployee(employee);
        setSelectedDeduction(deduction);
        setEditData({
            amount: deduction.amount.toString(),
            notes: deduction.notes || '',
        });
        setOpenEdit(true);
    };

    const handleEditDeduction = () => {
        if (!selectedDeduction) return;
        put(route('employee-deductions.update', selectedDeduction.id), {
            onSuccess: () => {
                resetEdit();
                setOpenEdit(false);
                setSelectedDeduction(null);
            },
        });
    };

    const handleDelete = (deduction: EmployeeDeduction) => {
        if (confirm('Are you sure you want to delete this deduction?')) {
            router.delete(route('employee-deductions.destroy', deduction.id));
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatNumber = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Deductions" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Employee Deductions" description="Record and manage employee deductions per pay period." />

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
                            <p className="mb-1 font-semibold">How to manage deductions:</p>
                            <p className="text-teal-700 dark:text-teal-400">
                                Click on an employee's avatar to view their complete details and manage deductions.
                                <span className="font-medium"> Hover over the avatar</span> to see the view icon.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="w-[160px]">
                            <CustomComboBox
                                items={monthOptions}
                                placeholder="Select Month"
                                value={filterData.month.toString()}
                                onSelect={(value) => setFilterData('month', value ? parseInt(value) : 0)}
                            />
                        </div>

                        <div className="w-[120px]">
                            <CustomComboBox
                                items={YEARS}
                                placeholder="Select Year"
                                value={filterData.year.toString()}
                                onSelect={(value) => setFilterData('year', value ? parseInt(value) : currentYear)}
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

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="has_deductions"
                                checked={filterData.has_deductions}
                                onCheckedChange={(checked) => setFilterData('has_deductions', checked as boolean)}
                            />
                            <Label htmlFor="has_deductions" className="cursor-pointer text-sm select-none">
                                Has deductions only
                            </Label>
                        </div>

                        <Button onClick={handleFilterChange}>Filter</Button>
                    </div>
                </div>
                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Employee</TableHead>
                                <TableHead className="text-primary font-bold">Monthly Salary</TableHead>
                                <TableHead className="text-primary font-bold">Deductions</TableHead>
                                <TableHead className="text-primary text-right font-bold">Total Deductions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {employees.data.length > 0 ? (
                                employees.data.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        // Save current filters to sessionStorage before navigating
                                                        sessionStorage.setItem('employeeDeductionsFilters', JSON.stringify(filterData));
                                                        router.get(route('manage.employees.index', employee.id));
                                                    }}
                                                    className="group relative cursor-pointer"
                                                    title={`View details of ${employee.first_name} ${employee.last_name}`}
                                                >
                                                    <Avatar className="h-10 w-10 border-2 border-slate-200 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-slate-700 dark:hover:border-blue-500">
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
                                                    <div className="absolute -right-1 -bottom-1 rounded-full bg-blue-500 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                    </div>
                                                </button>
                                                <div className="flex flex-col">
                                                    <span className="font-bold uppercase">
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name} {employee.suffix}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">{employee.position}</span>
                                                    <span className="text-muted-foreground text-xs"> {employee.office?.name}</span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            {employee.latest_salary ? (
                                                <div className="text-right font-medium">{formatCurrency(Number(employee.latest_salary.amount))}</div>
                                            ) : (
                                                <span className="text-muted-foreground italic">-</span>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {employee.deductions && employee.deductions.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {employee.deductions.map((deduction) => (
                                                        <span
                                                            key={deduction.id}
                                                            className="bg-muted flex items-center gap-1 rounded px-2 py-1 text-xs"
                                                        >
                                                            {deduction.deduction_type?.name}: {formatCurrency(Number(deduction.amount))}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">No deductions</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {employee.deductions
                                                ? formatCurrency(employee.deductions.reduce((sum, d) => sum + Number(d.amount), 0))
                                                : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-3 text-center text-gray-500">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Pagination data={employees} />
                {/* Add Deduction Dialog */}
                <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Deduction</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Employee</Label>
                                <div className="text-lg font-medium">
                                    {selectedEmployee?.last_name}, {selectedEmployee?.first_name} {selectedEmployee?.middle_name}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Pay Period</Label>
                                <div className="text-lg font-medium">
                                    {MONTHS.find((m) => m.value === addData.pay_period_month)?.label} {addData.pay_period_year}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="deduction_type">Deduction Type</Label>
                                <CustomComboBox
                                    items={deductionTypeOptions}
                                    placeholder="Select deduction type"
                                    value={addData.deduction_type_id.toString()}
                                    onSelect={(value) => setAddData('deduction_type_id', value ? parseInt(value) : 0)}
                                />
                                {errors.deduction_type_id && <p className="text-destructive text-sm">{errors.deduction_type_id}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (PHP)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={addData.amount}
                                    onChange={(e) => setAddData('amount', e.target.value)}
                                    placeholder="0.00"
                                />
                                {errors.amount && <p className="text-destructive text-sm">{errors.amount}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={addData.notes}
                                    onChange={(e) => setAddData('notes', e.target.value)}
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenAdd(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddDeduction}>Add Deduction</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* Edit Deduction Dialog */}
                <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Deduction</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Employee</Label>
                                <div className="text-lg font-medium">
                                    {selectedEmployee?.last_name}, {selectedEmployee?.first_name} {selectedEmployee?.middle_name}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Deduction Type</Label>
                                <div className="text-lg font-medium">{selectedDeduction?.deduction_type?.name}</div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-amount">Amount (PHP)</Label>
                                <Input
                                    id="edit-amount"
                                    type="number"
                                    step="0.01"
                                    value={editData.amount}
                                    onChange={(e) => setEditData('amount', e.target.value)}
                                />
                                {editErrors.amount && <p className="text-destructive text-sm">{editErrors.amount}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-notes">Notes</Label>
                                <Textarea id="edit-notes" value={editData.notes} onChange={(e) => setEditData('notes', e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenEdit(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditDeduction}>Update</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
