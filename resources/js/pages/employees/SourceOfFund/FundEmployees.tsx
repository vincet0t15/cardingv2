import { CustomComboBox } from '@/components/CustomComboBox';
import Pagination from '@/components/paginationData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, FileText, Filter, Printer, Search, X } from 'lucide-react';
import { useState } from 'react';

interface EmployeeRow {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    position: string | null;
    office: { name: string } | null;
    employment_status: { name: string } | null;
    total_compensation: number;
}

interface FundInfo {
    code: string;
    general_fund_name: string | null;
    description: string | null;
    count: number;
    total: number;
}

interface Props {
    [key: string]: any;
    fundCode: string;
    fundInfo: FundInfo;
    employees: {
        data: EmployeeRow[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    offices: { id: number; name: string }[];
    filters: {
        year: number;
        month: number | null;
        office_id: number | null;
        search: string | null;
    };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function FundSourceEmployees() {
    const { props } = usePage<Props>();
    const { fundCode, fundInfo, employees, offices, filters } = props;

    const [search, setSearch] = useState(filters.search || '');
    const [showPrintPreview, setShowPrintPreview] = useState(false);

    const handleFilterChange = (key: string, value: any) => {
        router.get(
            route('employees.source-of-fund.employees', { fundCode: fundCode }),
            {
                ...filters,
                [key]: value,
            },
            { preserveState: true },
        );
    };

    const clearFilters = () => {
        router.get(route('employees.source-of-fund.employees', { fundCode: fundCode }));
    };

    const hasActiveFilters = filters.month || filters.office_id || filters.search;

    const goBack = () => {
        router.get(route('employees.source-of-fund.index'));
    };

    const filteredEmployees = filters.search
        ? employees.data.filter((emp) => {
              const searchLower = filters.search?.toLowerCase() || '';
              return (
                  `${emp.last_name}, ${emp.first_name} ${emp.middle_name || ''}`.toLowerCase().includes(searchLower) ||
                  emp.position?.toLowerCase().includes(searchLower)
              );
          })
        : employees.data;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employees by Source of Fund',
            href: '/employees/source-of-fund',
        },
        {
            title: fundInfo.general_fund_name || fundCode,
            href: route('employees.source-of-fund.employees', { fundCode: fundCode }),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Employees - ${fundInfo.general_fund_name || fundCode}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Button variant="outline" size="sm" onClick={goBack} className="w-max">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back
                </Button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="text-muted-foreground h-5 w-5" />
                        <div>
                            <h2 className="text-lg font-semibold">{fundInfo.general_fund_name || 'Unfunded'}</h2>
                            <p className="text-muted-foreground text-sm">
                                {fundInfo.code} - {fundInfo.description || 'No description'}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowPrintPreview(true)}>
                        <Printer className="mr-1 h-4 w-4" />
                        Print
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="text-muted-foreground h-4 w-4" />
                                <CardTitle className="text-sm">Filters</CardTitle>
                            </div>
                            <div className="flex gap-2">
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="mr-1 h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Year</label>
                                <input
                                    type="number"
                                    value={filters.year}
                                    onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
                                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    min="2020"
                                    max="2100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Month</label>
                                <CustomComboBox
                                    items={MONTHS.map((month, index) => ({ value: String(index + 1), label: month }))}
                                    placeholder="All Months"
                                    value={filters.month?.toString() || null}
                                    onSelect={(value) => handleFilterChange('month', value ? parseInt(value) : null)}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Office</label>
                                <CustomComboBox
                                    items={offices.map((office) => ({ value: String(office.id), label: office.name }))}
                                    placeholder="All Offices"
                                    value={filters.office_id?.toString() || null}
                                    onSelect={(value) => handleFilterChange('office_id', value ? parseInt(value) : null)}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Search</label>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        placeholder="Employee name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleFilterChange('search', search);
                                            }
                                        }}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Employee List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Office</TableHead>
                                        <TableHead className="text-right">Total Compensation</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((employee) => (
                                            <TableRow key={employee.id} className="hover:bg-muted/30">
                                                <TableCell>
                                                    <span className="font-bold uppercase">
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{employee.position || '-'}</TableCell>
                                                <TableCell>{employee.office?.name || '-'}</TableCell>
                                                <TableCell className="text-right font-medium text-green-600">
                                                    {formatCurrency(employee.total_compensation)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                                                No employees found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <Pagination data={employees} />
                    </CardContent>
                </Card>
            </div>

            {showPrintPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="max-h-[90vh] min-w-[800px] overflow-auto rounded-lg bg-white p-8 shadow-xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">Employees by Source of Fund</h1>
                                <h2 className="text-lg font-semibold">
                                    {fundInfo.general_fund_name || 'Unfunded'} - {fundInfo.code}
                                </h2>
                                <p className="text-muted-foreground text-sm">{fundInfo.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm">Total Employees: {fundInfo.count}</p>
                                <p className="text-sm">Total Amount: {formatCurrency(fundInfo.total)}</p>
                                <p className="text-muted-foreground text-xs">
                                    {MONTHS[filters.month ? filters.month - 1 : 0]} {filters.year}
                                </p>
                            </div>
                        </div>

                        <table className="w-full border-collapse border">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="border p-2 text-left">Employee</th>
                                    <th className="border p-2 text-left">Position</th>
                                    <th className="border p-2 text-left">Office</th>
                                    <th className="border p-2 text-right">Total Compensation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((employee) => (
                                    <tr key={employee.id}>
                                        <td className="border p-2">
                                            {employee.last_name}, {employee.first_name} {employee.middle_name}
                                        </td>
                                        <td className="border p-2">{employee.position || '-'}</td>
                                        <td className="border p-2">{employee.office?.name || '-'}</td>
                                        <td className="border p-2 text-right">{formatCurrency(employee.total_compensation)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold">
                                    <td colSpan={3} className="border p-2 text-right">
                                        Total:
                                    </td>
                                    <td className="border p-2 text-right">{formatCurrency(fundInfo.total)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="mt-6 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                                Close
                            </Button>
                            <Button onClick={() => window.print()}>
                                <Printer className="mr-1 h-4 w-4" />
                                Print
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
