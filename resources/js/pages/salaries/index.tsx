import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { Head, router, useForm } from '@inertiajs/react';
import { History, PlusIcon, Search, User } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Salaries',
        href: '/salaries',
    },
];

interface SalariesProps {
    employees: PaginatedDataResponse<Employee>;
    offices: Office[];
    employmentStatuses: EmploymentStatus[];
    sourceOfFundCodes: { id: number; code: string; description: string | null; status: boolean }[];
    filters: FilterProps & { office_id?: string; employment_status_id?: string };
}

export default function SalariesIndex({ employees, offices, employmentStatuses, sourceOfFundCodes, filters }: SalariesProps) {
    const { data: filterData, setData: setFilterData } = useForm({
        search: filters.search || '',
        office_id: filters.office_id || '',
        employment_status_id: filters.employment_status_id || '',
    });

    const [openAdd, setOpenAdd] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const {
        data: salaryData,
        setData: setSalaryData,
        post,
        reset,
        errors,
    } = useForm({
        employee_id: 0,
        amount: '',
        effective_date: new Date().toISOString().split('T')[0],
        source_of_fund_code_id: null as number | null,
    });

    const officeOptions = offices.map((o) => ({ value: o.id.toString(), label: o.name }));
    const employmentStatusOptions = employmentStatuses.map((s) => ({ value: s.id.toString(), label: s.name }));
    const sourceOfFundOptions = sourceOfFundCodes.map((fund) => ({
        value: fund.id.toString(),
        label: `${fund.code} - ${fund.description || 'No description'}`,
    }));

    const applyFilters = () => {
        const queryString: Record<string, string> = {};
        if (filterData.search) queryString.search = filterData.search;
        if (filterData.office_id) queryString.office_id = filterData.office_id;
        if (filterData.employment_status_id) queryString.employment_status_id = filterData.employment_status_id;
        router.get(route('salaries.index'), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    };

    const handleOpenAdd = (employee: Employee) => {
        setSelectedEmployee(employee);
        setSalaryData('employee_id', employee.id);
        setOpenAdd(true);
    };

    const handleAddSalary = () => {
        post(route('salaries.store'), {
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
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Salaries" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Employee Salaries" description="Manage employee salary records with history tracking." />

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
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
                    </div>
                </div>

                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Employee</TableHead>
                                <TableHead className="text-primary text-right font-bold">Current Salary</TableHead>
                                <TableHead className="text-primary w-[150px] text-center font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {employees.data.length > 0 ? (
                                employees.data.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-12 w-12 border-2 border-slate-200 shadow-sm dark:border-slate-700">
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
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name} {employee.suffix}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">{employee.position}</span>
                                                    <span className="text-muted-foreground text-xs"> {employee.office?.name}</span>
                                                    <Badge variant="outline" className="bg-teal-800 text-white">
                                                        {employee.employment_status?.name}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {employee.latest_salary ? formatCurrency(employee.latest_salary.amount) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                    onClick={() => router.get(route('salaries.history', employee.id))}
                                                    title="View Salary History"
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                                                    onClick={() => handleOpenAdd(employee)}
                                                    title="Add Salary Record"
                                                >
                                                    <PlusIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-3 text-center text-gray-500">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination data={employees} />

                {/* Add Salary Dialog */}
                <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Salary Record</DialogTitle>
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
                                    value={salaryData.amount}
                                    onChange={(e) => setSalaryData('amount', e.target.value)}
                                    placeholder="0.00"
                                />
                                {errors.amount && <p className="text-destructive text-sm">{errors.amount}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="effective_date">Effective Date</Label>
                                <Input
                                    id="effective_date"
                                    type="date"
                                    value={salaryData.effective_date}
                                    onChange={(e) => setSalaryData('effective_date', e.target.value)}
                                />
                                {errors.effective_date && <p className="text-destructive text-sm">{errors.effective_date}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="source_of_fund_code_id">Source of Fund Code (Optional)</Label>
                                <CustomComboBox
                                    items={sourceOfFundOptions}
                                    placeholder="Select source of fund..."
                                    value={salaryData.source_of_fund_code_id?.toString() || null}
                                    onSelect={(value) => setSalaryData('source_of_fund_code_id', value ? parseInt(value) : null)}
                                />
                                {errors.source_of_fund_code_id && <p className="text-destructive text-sm">{errors.source_of_fund_code_id}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenAdd(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddSalary}>Add Salary</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
