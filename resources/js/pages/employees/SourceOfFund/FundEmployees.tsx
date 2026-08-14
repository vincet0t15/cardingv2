import { CustomComboBox } from '@/components/CustomComboBox';
import Pagination from '@/components/paginationData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type LinkProps } from '@/types/pagination';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, FileText, Filter, Printer, Search, X } from 'lucide-react';
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

interface EmployeesPaginated {
    data: EmployeeRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    path: string;
    links: LinkProps[];
}

interface Props {
    [key: string]: any;
    fundCode: string;
    fundInfo: FundInfo;
    employees: EmployeesPaginated;
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

    const handleFilterChange = (key: string, value: string | number | null) => {
        const params = new URLSearchParams(window.location.search);
        if (value !== null && value !== undefined && value !== '') {
            params.set(key, String(value));
        } else {
            params.delete(key);
        }

        router.get(
            route('employees.source-of-fund.employees', { fundCode: fundCode }) + '?' + params.toString(),
            undefined,
            { preserveState: true, preserveScroll: true },
        );
    };

    const clearFilters = () => {
        router.get(route('employees.source-of-fund.employees', { fundCode: fundCode }), undefined, { preserveState: true, preserveScroll: true });
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const params = new URLSearchParams();
                            if (filters.year) params.append('year', filters.year.toString());
                            if (filters.month) params.append('month', filters.month.toString());
                            if (filters.office_id) params.append('office_id', filters.office_id.toString());
                            if (filters.search) params.append('search', filters.search);
                            window.open(route('employees.source-of-fund.fund-print', { fundCode: fundCode }) + '?' + params.toString(), '_blank');
                        }}
                    >
                        <Printer className="mr-1 h-4 w-4" />
                        Print
                    </Button>
                </div>

                {fundCode === 'Unfunded' && (
                    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <CardContent className="pt-5">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div className="space-y-3 text-sm text-amber-900 dark:text-amber-100">
                                    <div>
                                        <p className="font-semibold">Why are these employees &quot;Unfunded&quot;?</p>
                                        <p className="mt-1 text-amber-800 dark:text-amber-200">
                                            The employees in this list have a Salary, Hazard Pay, or Clothing Allowance record that is{' '}
                                            <span className="font-semibold">missing a Source of Fund</span>. When their compensation record was
                                            encoded, the <span className="font-mono">Source of Fund</span> field was left blank, so it was saved
                                            as <span className="font-semibold">NULL</span> in the database. The report automatically tags a record
                                            as &quot;Unfunded&quot; whenever it has no source of fund.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">How to fix this</p>
                                        <ul className="mt-1 list-decimal space-y-1 pl-5 text-amber-800 dark:text-amber-200">
                                            <li>
                                                Open the employee&apos;s profile &rarr; <span className="font-semibold">Compensation</span> &rarr;
                                                edit the Salary / Hazard Pay / Clothing Allowance, then select the correct{' '}
                                                <span className="font-semibold">Source of Fund</span>.
                                            </li>
                                            <li>
                                                Once it is saved with a source of fund, the employee will be removed from this list and moved to
                                                the correct fund card above.
                                            </li>
                                            <li>
                                                To prevent this from happening again: make the <span className="font-semibold">Source of Fund</span>{' '}
                                                field required on the form so a salary cannot be processed without a fund.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                                    onChange={(e) => handleFilterChange('year', parseInt((e.target as HTMLInputElement).value))}
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
                                        onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleFilterChange('search', (e.target as HTMLInputElement).value);
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
        </AppLayout>
    );
}
