import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Office } from '@/types/office';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/dashboard',
    },
    {
        title: 'Employment Type Report',
        href: '/reports/employment-type',
    },
];

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    suffix: string | null;
    position: string | null;
    office: Office | null;
    employment_status: { id: number; name: string } | null;
}

interface EmploymentStatus {
    id: number;
    name: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ReportProps {
    employees: Employee[];
    pagination: Pagination;
    employmentStatuses: EmploymentStatus[];
    selectedStatus: EmploymentStatus | null;
    filters: {
        employment_status_id: number | null;
        search: string | null;
        office_id: number | null;
        per_page: number;
    };
}

export default function EmploymentTypeReport({ employees, pagination, employmentStatuses, selectedStatus, filters }: ReportProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [employmentStatusId, setEmploymentStatusId] = useState(filters.employment_status_id?.toString() || '');

    const statusOptions = employmentStatuses.map((s) => ({
        value: s.id.toString(),
        label: s.name,
    }));

    const handleSearch = () => {
        router.get(
            route('reports.employment-type'),
            {
                search: search || null,
                employment_status_id: employmentStatusId || null,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleClear = () => {
        setSearch('');
        setEmploymentStatusId('');
        router.get(route('reports.employment-type'), {}, { preserveState: true, preserveScroll: true });
    };

    const handlePrint = () => {
        const params = new URLSearchParams();
        if (filters.employment_status_id) params.set('employment_status_id', filters.employment_status_id.toString());
        if (filters.search) params.set('search', filters.search);
        if (filters.office_id) params.set('office_id', filters.office_id.toString());

        window.open(`/reports/employment-type/print?${params.toString()}`, '_blank');
    };

    const handlePageChange = (page: number) => {
        router.get(route('reports.employment-type'), { ...filters, page }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employment Type Report" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.get(route('dashboard'))}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Employment Type Report</h1>
                            {selectedStatus && (
                                <p className="text-muted-foreground text-sm">
                                    Showing employees with status: <span className="font-semibold">{selectedStatus.name}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filters</CardTitle>
                        <CardDescription>Filter employees by employment status and search by name</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="employment_status">Employment Status</Label>
                                <CustomComboBox
                                    items={statusOptions}
                                    placeholder="All Statuses"
                                    value={employmentStatusId || null}
                                    onSelect={(value) => setEmploymentStatusId(value || '')}
                                />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Search by name or position..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleSearch}>Filter</Button>
                                <Button variant="outline" onClick={handleClear}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Results ({pagination.total} employee{pagination.total !== 1 ? 's' : ''})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {employees.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="pb-3 text-left text-sm font-medium">#</th>
                                                <th className="pb-3 text-left text-sm font-medium">Employee Name</th>
                                                <th className="pb-3 text-left text-sm font-medium">Position</th>
                                                <th className="pb-3 text-left text-sm font-medium">Office</th>
                                                <th className="pb-3 text-left text-sm font-medium">Employment Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.map((employee, index) => (
                                                <tr key={employee.id} className="border-b last:border-0">
                                                    <td className="py-3 text-sm">
                                                        {(pagination.current_page - 1) * pagination.per_page + index + 1}
                                                    </td>
                                                    <td className="py-3 text-sm font-medium">
                                                        {employee.last_name}, {employee.first_name}
                                                        {employee.middle_name && ` ${employee.middle_name}`}
                                                        {employee.suffix && ` ${employee.suffix}`}
                                                    </td>
                                                    <td className="py-3 text-sm">{employee.position || 'N/A'}</td>
                                                    <td className="py-3 text-sm">{employee.office?.name || 'N/A'}</td>
                                                    <td className="py-3 text-sm">
                                                        <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                                                            {employee.employment_status?.name || 'N/A'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-muted-foreground text-sm">
                                            Page {pagination.current_page} of {pagination.last_page}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.current_page === 1}
                                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.current_page === pagination.last_page}
                                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-muted-foreground">No employees found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
