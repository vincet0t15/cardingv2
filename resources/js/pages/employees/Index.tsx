import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Employee } from '@/types/employee';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import { FilterProps } from '@/types/filter';
import type { Office } from '@/types/office';
import { PaginatedDataResponse } from '@/types/pagination';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PlusIcon, Search, User } from 'lucide-react';
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
];

interface Props {
    employees: PaginatedDataResponse<Employee>;
    offices: Office[];
    employmentStatuses: EmploymentStatus[];
    filters: FilterProps & { office_id?: string; employment_status_id?: string };
}
export default function Employees({ employees, offices, employmentStatuses, filters }: Props) {
    const { data, setData } = useForm({
        search: filters.search || '',
        office_id: filters.office_id || '',
        employment_status_id: filters.employment_status_id || '',
    });

    const applyFilters = (overrides?: Partial<typeof data>) => {
        const merged = { ...data, ...overrides };
        const queryString: Record<string, string> = {};
        if (merged.search) queryString.search = merged.search;
        if (merged.office_id) queryString.office_id = merged.office_id;
        if (merged.employment_status_id) queryString.employment_status_id = merged.employment_status_id;
        router.get(route('employees.index'), queryString, {
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

    const officeOptions = offices.map((office) => ({
        value: office.id.toString(),
        label: office.name,
    }));

    const employmentStatusOptions = [
        { value: 'all', label: 'All Status' },
        ...employmentStatuses.map((status) => ({
            value: status.id.toString(),
            label: status.name,
        })),
    ];

    const handleOfficeChange = (value: string) => {
        const newOfficeId = value === '' ? '' : value;
        setData('office_id', newOfficeId);
        applyFilters({ office_id: newOfficeId });
    };

    const handleEmploymentStatusChange = (value: string) => {
        const newStatusId = value === 'all' ? '' : value;
        setData('employment_status_id', newStatusId);
        applyFilters({ employment_status_id: newStatusId });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Employee List"
                    description="Manage all employees, with options to view, edit, or delete records and track their employment statuses."
                />

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
                            <p className="mb-1 font-semibold">How to manage employees:</p>
                            <p className="text-teal-700 dark:text-teal-400">
                                Click on an employee's avatar to view their complete details and manage records.
                                <span className="font-medium"> Hover over the avatar</span> to see the view icon.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button onClick={() => router.get(route('employees.create'))}>
                        <PlusIcon className="h-4 w-4" />
                        Add Employee
                    </Button>

                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <div className="w-full">
                            <CustomComboBox
                                items={officeOptions}
                                placeholder="All Offices"
                                value={data.office_id || null}
                                onSelect={(value) => handleOfficeChange(value ?? '')}
                            />
                        </div>

                        <div className="w-[280px]">
                            <CustomComboBox
                                items={employmentStatusOptions}
                                placeholder="All Status"
                                value={data.employment_status_id || 'all'}
                                onSelect={(value) => handleEmploymentStatusChange(value ?? '')}
                            />
                        </div>

                        <div className="relative w-full sm:w-[450px]">
                            <Label htmlFor="search" className="sr-only">
                                Search
                            </Label>
                            <Input
                                id="search"
                                placeholder="Search the employee..."
                                className="w-full pl-8"
                                value={data.search}
                                onChange={(e) => setData({ ...data, search: e.target.value })}
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
                                <TableHead className="text-primary font-bold">Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {employees.data.length > 0 ? (
                                employees.data.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-muted/30">
                                        <TableCell className="text-sm">
                                            <Link
                                                href={route('manage.employees.index', employee.id)}
                                                className="group relative flex cursor-pointer items-center gap-2"
                                                title={`View details of ${employee.first_name} ${employee.last_name}`}
                                            >
                                                <div className="relative">
                                                    <Avatar className="h-12 w-12 border-2 border-slate-200 shadow-sm transition-all hover:border-green-800 hover:shadow-md dark:border-slate-700 dark:hover:border-green-500">
                                                        {employee.image_path ? (
                                                            <AvatarImage
                                                                src={employee.image_path ?? undefined}
                                                                alt={`${employee.first_name} ${employee.middle_name} ${employee.last_name}`}
                                                                className="object-cover"
                                                            />
                                                        ) : null}
                                                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                                                            <User className="h-6 w-6 text-slate-400" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="font-bold uppercase">
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name} {employee.suffix}
                                                    </span>
                                                    <span className="text-muted-foreground text-[0.70rem]">{employee.office?.name}</span>

                                                    <span className="text-muted-foreground text-[0.70rem]">{employee.position}</span>
                                                    <Badge variant="outline" className="bg-teal-800 text-white">
                                                        {employee.employment_status?.name}
                                                    </Badge>
                                                </div>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-3 text-center text-gray-500">
                                        No data available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div>
                    <Pagination data={employees} />
                </div>
            </div>
        </AppLayout>
    );
}
