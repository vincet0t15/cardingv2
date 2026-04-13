import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Employee as EmployeeType } from '@/types/employee';
import { Head, router } from '@inertiajs/react';
import { FileText, Filter, Users, X } from 'lucide-react';

interface SourceOfFundCode {
    id: number;
    code: string;
    description: string | null;
    status: boolean;
}

interface Office {
    id: number;
    name: string;
}

interface FundingSource {
    salary: number;
    pera: number;
    rata: number;
    total: number;
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
        links: { url: string | null; label: string; active: boolean }[];
    };
    sourceOfFundCodes: SourceOfFundCode[];
    offices: Office[];
    filters: {
        year: number;
        month: number | null;
        office_id: number | null;
        source_of_fund_code_id: number | null;
    };
    summary: {
        total_employees: number;
        total_compensation: number;
        by_fund: Record<string, { count: number; total: number }>;
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
        router.get(route('employees.source-of-fund.index'));
    };

    const hasActiveFilters = filters.month || filters.office_id || filters.source_of_fund_code_id;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees by Source of Fund" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="text-muted-foreground h-5 w-5" />
                        <div>
                            <h2 className="text-lg font-semibold">Employees by Source of Fund</h2>
                            <p className="text-muted-foreground text-sm">Track employee compensation funding sources for government accountability</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_employees}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Compensation</CardTitle>
                            <FileText className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_compensation)}</div>
                        </CardContent>
                    </Card>

                    {Object.entries(summary.by_fund).map(([fundCode, data]) => (
                        <Card key={fundCode} className="border-blue-200 bg-blue-50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-blue-800">{fundCode}</CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-700">{formatCurrency(data.total)}</div>
                                <p className="mt-1 text-xs text-blue-600">
                                    {data.count} employee{data.count !== 1 ? 's' : ''}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
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
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                                <label className="mb-1 block text-sm font-medium">Source of Fund</label>
                                <CustomComboBox
                                    items={sourceOfFundCodes.map((fund) => ({
                                        value: String(fund.id),
                                        label: `${fund.code} - ${fund.description || ''}`,
                                    }))}
                                    placeholder="All Funds"
                                    value={filters.source_of_fund_code_id?.toString() || null}
                                    onSelect={(value) => handleFilterChange('source_of_fund_code_id', value ? parseInt(value) : null)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Employees Table */}
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
                                        <TableHead>Position</TableHead>
                                        <TableHead>Office</TableHead>
                                        <TableHead className="text-right">Salary</TableHead>
                                        <TableHead className="text-right">PERA</TableHead>
                                        <TableHead className="text-right">RATA</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Funding Sources</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {employees.data.length > 0 ? (
                                        employees.data.map((employee) => (
                                            <TableRow key={employee.id} className="hover:bg-muted/30">
                                                <TableCell className="font-medium">
                                                    {employee.last_name}, {employee.first_name} {employee.middle_name}
                                                </TableCell>
                                                <TableCell>{employee.position}</TableCell>
                                                <TableCell>{employee.office?.name || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(employee.funding_sources['Unfunded']?.salary || 0)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(employee.funding_sources['Unfunded']?.pera || 0)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(employee.funding_sources['Unfunded']?.rata || 0)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-green-600">
                                                    {formatCurrency(employee.total_compensation)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.keys(employee.funding_sources)
                                                            .filter((code) => code !== 'Unfunded')
                                                            .map((code) => (
                                                                <Badge key={code} variant="secondary" className="text-xs">
                                                                    {code}
                                                                </Badge>
                                                            ))}
                                                        {Object.keys(employee.funding_sources).length === 0 && (
                                                            <span className="text-muted-foreground text-xs">No funding source</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-3 text-center text-gray-500">
                                                No employees found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {employees.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-muted-foreground text-sm">
                                    Showing {employees.data.length} of {employees.total} employees
                                </div>
                                <div className="flex gap-2">
                                    {employees.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                        >
                                            {link.label === '&laquo; Previous' ? 'Previous' : link.label === 'Next &raquo;' ? 'Next' : link.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
