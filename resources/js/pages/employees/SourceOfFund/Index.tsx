import { CustomComboBox } from '@/components/CustomComboBox';
import Pagination from '@/components/paginationData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Employee as EmployeeType } from '@/types/employee';
import { Head, router } from '@inertiajs/react';
import { ArrowUpRight, FileText, Filter, HelpCircle, Printer, Search, Users, X } from 'lucide-react';
import { useState } from 'react';

interface SourceOfFundCode {
    id: number;
    code: string;
    description: string | null;
    status: boolean;
    general_fund?: { id: number; name: string } | null;
}

interface Office {
    id: number;
    name: string;
}

interface FundingSource {
    salary: number;
    hazard_pay: number;
    clothing_allowance: number;
    pera: number;
    rata: number;
    total: number;
    code: string;
    general_fund_name: string | null;
    description: string | null;
}

interface EmployeeWithFunding extends EmployeeType {
    funding_sources: Record<string, FundingSource>;
    total_compensation: number;
}

interface Props {
    employees: {
        data: EmployeeWithFunding[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        path: string;
        links: { url: string | null; label: string; active: boolean }[];
    };
    sourceOfFundCodes: SourceOfFundCode[];
    offices: Office[];
    filters: {
        year: number;
        month: number | null;
        office_id: number | null;
        source_of_fund_code_id: number | null;
        search: string | null;
    };
    summary: {
        total_employees: number;
        total_compensation: number;
        by_fund: Record<string, { count: number; total: number; code: string; general_fund_name: string | null; description: string | null }>;
    };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees by Source of Fund',
        href: '/employees/source-of-fund',
    },
];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
}

export default function Index({ employees, sourceOfFundCodes, offices, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilterChange = (key: string, value: any) => {
        router.get(
            route('employees.source-of-fund.index'),
            {
                ...filters,
                [key]: value,
            },
            {
                preserveState: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch('');
        router.get(route('employees.source-of-fund.index'));
    };

    const hasActiveFilters = filters.month || filters.office_id || filters.source_of_fund_code_id || filters.search;

    const viewFundEmployees = (fundCode: string) => {
        router.get(route('employees.source-of-fund.employees', { fundCode: fundCode }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees by Source of Fund" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="text-muted-foreground h-5 w-5" />
                        <div>
                            <h2 className="text-lg font-semibold">Employees by Source of Fund</h2>
                            <p className="text-muted-foreground text-sm">Track employee compensation funding sources for government accountability</p>
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
                            if (filters.source_of_fund_code_id) params.append('source_of_fund_code_id', filters.source_of_fund_code_id.toString());
                            if (filters.search) params.append('search', filters.search);
                            window.open(route('employees.source-of-fund.print') + '?' + params.toString(), '_blank');
                        }}
                    >
                        <Printer className="mr-1 h-4 w-4" />
                        Print
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(summary.by_fund)
                        .filter(([code]) => code !== 'Unfunded')
                        .map(([fundDisplayName, data], index) => {
                            const colors = [
                                'from-emerald-500 to-emerald-600',
                                'from-sky-500 to-blue-600',
                                'from-orange-500 to-amber-600',
                                'from-violet-500 to-fuchsia-600',
                                'from-rose-500 to-pink-600',
                                'from-cyan-500 to-sky-600',
                                'from-amber-500 to-orange-600',
                                'from-indigo-500 to-purple-600',
                            ];
                            const color = colors[index % colors.length];
                            return (
                                <Card
                                    key={fundDisplayName}
                                    className={`group relative cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:from-slate-900 dark:to-slate-800`}
                                    onClick={() => viewFundEmployees(fundDisplayName)}
                                >
                                    <div
                                        className={`absolute top-0 right-0 h-24 w-24 bg-gradient-to-br ${color} opacity-10 blur-2xl transition-all group-hover:opacity-20`}
                                    />
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <div className="flex flex-col">
                                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {data.general_fund_name || '-'}
                                            </CardTitle>
                                            <span className="text-muted-foreground text-xs">
                                                {data.code} - {data.description || '-'}
                                            </span>
                                        </div>
                                        <div
                                            className={`bg-gradient-to-br ${color} rounded-lg p-2 shadow-sm transition-transform group-hover:scale-110`}
                                        >
                                            <Users className="h-4 w-4 text-white" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{data.count}</div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <p className="text-muted-foreground text-xs">{formatCurrency(data.total)}</p>
                                            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:from-violet-900/30 dark:to-indigo-900/30 dark:text-violet-300">
                                                View
                                                <ArrowUpRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    {summary.by_fund['Unfunded']?.count > 0 && (
                        <Card
                            className={`group relative cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:from-slate-900 dark:to-slate-800`}
                            onClick={() => viewFundEmployees('Unfunded')}
                        >
                            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-slate-500 to-slate-600 opacity-10 blur-2xl transition-all group-hover:opacity-20" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Unfunded</CardTitle>
                                <div className="rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 p-2 shadow-sm transition-transform group-hover:scale-110">
                                    <FileText className="h-4 w-4 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900 dark:text-white">{summary.by_fund['Unfunded']?.count || 0}</div>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-muted-foreground text-xs">{formatCurrency(summary.by_fund['Unfunded']?.total || 0)}</p>
                                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:from-violet-900/30 dark:to-indigo-900/30 dark:text-violet-300">
                                        View
                                        <ArrowUpRight className="h-3 w-3" />
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <HelpCircle className="text-muted-foreground h-4 w-4" />
                            <CardTitle className="text-sm">Frequently Asked Questions</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Collapsible className="w-full">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between text-sm font-medium">
                                    How do I view employees for a specific funding code?
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="text-muted-foreground mt-2 text-sm">
                                Click on any funding source card above to view the list of employees funded by that specific funding code. This will
                                show you detailed information about each employee, their position, office assignment, and compensation details.
                            </CollapsibleContent>
                        </Collapsible>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="text-muted-foreground h-4 w-4" />
                                <CardTitle className="text-sm">Filters</CardTitle>
                            </div>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="mr-1 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            )}
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
                                <label className="mb-1 block text-sm font-medium">Source of Fund</label>
                                <CustomComboBox
                                    items={sourceOfFundCodes.map((fund) => ({
                                        value: String(fund.id),
                                        label: fund.general_fund
                                            ? `${fund.general_fund.name} - ${fund.code}`
                                            : `${fund.code} - ${fund.description || ''}`,
                                    }))}
                                    placeholder="All Funds"
                                    value={filters.source_of_fund_code_id?.toString() || null}
                                    onSelect={(value) => handleFilterChange('source_of_fund_code_id', value ? parseInt(value) : null)}
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
                        <CardTitle>Employee Funding Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="text-right">Salary</TableHead>
                                        <TableHead className="text-right">PERA</TableHead>
                                        <TableHead className="text-right">RATA</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Funding Sources</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {employees.data.length > 0 ? (
                                        employees.data.map((employee) => {
                                            const totalSalary = Object.values(employee.funding_sources).reduce(
                                                (sum, src) => sum + (src.salary || 0),
                                                0,
                                            );
                                            const totalPero = Object.values(employee.funding_sources).reduce((sum, src) => sum + (src.pera || 0), 0);
                                            const totalRata = Object.values(employee.funding_sources).reduce((sum, src) => sum + (src.rata || 0), 0);

                                            return (
                                                <TableRow key={employee.id} className="hover:bg-muted/30">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold uppercase">
                                                                {employee.last_name}, {employee.first_name} {employee.middle_name}
                                                            </span>
                                                            <span className="text-muted-foreground text-xs">{employee.position || '-'}</span>
                                                            <span className="text-muted-foreground text-xs">{employee.office?.name || '-'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalSalary)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalPero)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalRata)}</TableCell>
                                                    <TableCell className="text-right font-medium text-green-600">
                                                        {formatCurrency(employee.total_compensation)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            {Object.keys(employee.funding_sources)
                                                                .filter((key) => key !== 'Unfunded')
                                                                .map((key) => {
                                                                    const source = employee.funding_sources[key];
                                                                    return (
                                                                        <div key={key} className="flex flex-col">
                                                                            <span className="text-xs font-medium">
                                                                                {source.general_fund_name || '-'}
                                                                            </span>
                                                                            <span className="text-muted-foreground text-xs">
                                                                                {source.code} - {source.description || '-'}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            {Object.keys(employee.funding_sources).filter((key) => key !== 'Unfunded').length ===
                                                                0 && <span className="text-muted-foreground text-xs">No funding source</span>}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-3 text-center text-gray-500">
                                                No employees found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {employees.last_page > 1 && <Pagination data={employees} />}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
