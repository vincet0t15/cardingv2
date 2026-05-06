import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { PaginatedDataResponse } from '@/types/pagination';
import { SourceOfFundCode } from '@/types/sourceOfFundCOde';
import { Head, router } from '@inertiajs/react';
import { Printer, Search, User, Wallet } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports/employees-by-source-of-fund',
    },
    {
        title: 'Employees by Source of Fund',
        href: '/reports/employees-by-source-of-fund',
    },
];

interface EmployeeRow {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    position: string | null;
    office: { name: string } | null;
    employment_status: { name: string } | null;
    source_of_fund_code: { code: string; description: string | null } | null;
    salary_amount: number | null;
    salary_effective_date: string | null;
}

interface Props {
    sourceOfFundCodes: SourceOfFundCode[];
    employees: PaginatedDataResponse<EmployeeRow>;
    offices: { id: number; name: string }[];
    employmentStatuses: { id: number; name: string }[];
    filters?: {
        source_of_fund_code_id?: string;
        office_id?: string;
        employment_status_id?: string;
        search?: string;
        year?: string;
    };
}

export default function EmployeesBySourceOfFund({ sourceOfFundCodes, employees, offices, employmentStatuses, filters = {} }: Props) {
    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '—';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const handleFilterChange = (key: string, value: string | number | null) => {
        router.get(route('reports.employees-by-source-of-fund'), {
            ...filters,
            [key]: value ?? '',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        handleFilterChange('search', formData.get('search') as string);
    };

    const handlePrint = () => {
        const params: Record<string, string> = {};
        if (filters.source_of_fund_code_id) params.source_of_fund_code_id = filters.source_of_fund_code_id;
        if (filters.year) params.year = filters.year;

        const queryString = new URLSearchParams(params).toString();
        window.open(`/reports/employees-by-source-of-fund/print?${queryString}`, '_blank');
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => ({
        value: (currentYear - 5 + i).toString(),
        label: (currentYear - 5 + i).toString(),
    })).reverse();

    const selectedFund = sourceOfFundCodes.find(f => f.id.toString() === filters.source_of_fund_code_id);
    const totalSalary = employees.data.reduce((sum, emp) => sum + (emp.salary_amount || 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees by Source of Fund" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Employees by Source of Fund" description="View all employees and their salary source of fund" />
                    <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <User className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{employees.total}</div>
                            <p className="text-muted-foreground text-xs">Showing {employees.data.length} in this page</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">With Salary</CardTitle>
                            <Wallet className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{employees.data.filter(e => e.salary_amount).length}</div>
                            <p className="text-muted-foreground text-xs">Have active salary</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
                            <Wallet className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalSalary)}</div>
                            <p className="text-muted-foreground text-xs">Sum of displayed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Source of Fund</CardTitle>
                            <Wallet className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold truncate">{selectedFund?.code || 'All'}</div>
                            <p className="text-muted-foreground text-xs">{selectedFund?.description || 'Showing all funds'}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-card rounded-lg border p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
                            <form onSubmit={handleSearch}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        name="search"
                                        placeholder="Search name..."
                                        className="pl-9"
                                        defaultValue={filters.search}
                                    />
                                </div>
                            </form>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Source of Fund</label>
                            <CustomComboBox
                                items={sourceOfFundCodes.map((fund) => ({ value: fund.id.toString(), label: `${fund.code} - ${fund.description || ''}` }))}
                                placeholder="All funds"
                                value={filters.source_of_fund_code_id || null}
                                onSelect={(value) => handleFilterChange('source_of_fund_code_id', value ?? null)}
                                showClear={true}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Office</label>
                            <CustomComboBox
                                items={offices.map((o) => ({ value: o.id.toString(), label: o.name }))}
                                placeholder="All offices"
                                value={filters.office_id || null}
                                onSelect={(value) => handleFilterChange('office_id', value ?? null)}
                                showClear={true}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Employment Status</label>
                            <CustomComboBox
                                items={employmentStatuses.map((s) => ({ value: s.id.toString(), label: s.name }))}
                                placeholder="All statuses"
                                value={filters.employment_status_id || null}
                                onSelect={(value) => handleFilterChange('employment_status_id', value ?? null)}
                                showClear={true}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Year</label>
                            <CustomComboBox
                                items={years}
                                placeholder="Select year"
                                value={filters.year || currentYear.toString()}
                                onSelect={(value) => handleFilterChange('year', value ?? null)}
                                showClear={true}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full overflow-hidden rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold">Employee</TableHead>
                                <TableHead className="font-bold">Source of Fund</TableHead>
                                <TableHead className="text-right font-bold">Monthly Salary</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {employees.data.length > 0 ? (
                                employees.data.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold uppercase">
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name} {employee.suffix}
                                                    </span>
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                        #{employee.id}
                                                    </Badge>
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{employee.position || '—'}</span>
                                                    <span>•</span>
                                                    <span>{employee.office?.name || '—'}</span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                                                        {employee.employment_status?.name || '—'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {employee.source_of_fund_code ? (
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                        {employee.source_of_fund_code.code}
                                                    </span>
                                                    {employee.source_of_fund_code.description && (
                                                        <span className="text-muted-foreground text-xs">
                                                            {employee.source_of_fund_code.description}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(employee.salary_amount)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <User className="mb-2 h-10 w-10" />
                                            <p>No employees found</p>
                                        </div>
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