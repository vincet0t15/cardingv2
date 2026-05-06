import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Employee as EmployeeType } from '@/types/employee';
import { Head, router } from '@inertiajs/react';
import { FileText, Filter, Search, Users, X } from 'lucide-react';
import { useState } from 'react';

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
    employeesByFund: Record<string, EmployeeRow[]>;
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

export default function Index({ employees, sourceOfFundCodes, offices, filters, summary, employeesByFund }: Props) {
    const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
    const [selectedFundCode, setSelectedFundCode] = useState<string | null>(null);
    const [dialogSearch, setDialogSearch] = useState('');

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

    const openEmployeeDialog = (fundCode: string) => {
        setSelectedFundCode(fundCode);
        setDialogSearch('');
        setShowEmployeeDialog(true);
    };

    const dialogEmployees = selectedFundCode ? employeesByFund[selectedFundCode] || [] : [];
    const filteredDialogEmployees = dialogSearch
        ? dialogEmployees.filter((emp) =>
              `${emp.last_name}, ${emp.first_name} ${emp.middle_name || ''}`.toLowerCase().includes(dialogSearch.toLowerCase()),
          )
        : dialogEmployees;

    const selectedFundData = selectedFundCode ? summary.by_fund[selectedFundCode] : null;

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
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card
                        className="cursor-pointer border-0 bg-gradient-to-br from-slate-50 to-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg dark:from-slate-900 dark:to-slate-800"
                        onClick={() => openEmployeeDialog('ALL')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_employees}</div>
                            <p className="text-muted-foreground text-xs">Click to view all</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg dark:from-amber-900/20 dark:to-orange-900/20"
                        onClick={() => openEmployeeDialog('Unfunded')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Unfunded</CardTitle>
                            <FileText className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.by_fund['Unfunded']?.count || 0}</div>
                            <p className="text-muted-foreground text-xs">{formatCurrency(summary.by_fund['Unfunded']?.total || 0)}</p>
                        </CardContent>
                    </Card>

                    {Object.entries(summary.by_fund)
                        .filter(([code]) => code !== 'Unfunded')
                        .map(([fundCode, data]) => (
                            <Card
                                key={fundCode}
                                className="cursor-pointer border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20"
                                onClick={() => openEmployeeDialog(fundCode)}
                            >
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">{fundCode}</CardTitle>
                                    <Users className="text-muted-foreground h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.count}</div>
                                    <p className="text-muted-foreground text-xs">{formatCurrency(data.total)}</p>
                                </CardContent>
                            </Card>
                        ))}
                </div>

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
                                        employees.data.map((employee) => (
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
                                            <TableCell colSpan={6} className="py-3 text-center text-gray-500">
                                                No employees found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

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

            <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
                <DialogContent className="flex max-h-[80vh] min-w-[100vh] flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>{selectedFundCode === 'ALL' ? 'All Employees' : `Employees - ${selectedFundCode}`}</DialogTitle>
                        <p className="text-muted-foreground text-sm">
                            {selectedFundData
                                ? `${selectedFundData.count} employees • ${formatCurrency(selectedFundData.total)}`
                                : `${dialogEmployees.length} employees`}
                        </p>
                    </DialogHeader>

                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search employee..."
                            value={dialogSearch}
                            onChange={(e) => setDialogSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex-1 overflow-auto rounded-md border">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0">
                                <TableRow>
                                    <TableHead>Employee</TableHead>

                                    <TableHead className="text-right">Total Compensation</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDialogEmployees.length > 0 ? (
                                    filteredDialogEmployees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold uppercase">
                                                        {employee.last_name}, {employee.first_name} {employee.middle_name}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">{employee.position || '-'}</span>
                                                    <span className="text-muted-foreground text-xs">{employee.office?.name || '-'}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right font-medium text-green-600">
                                                {formatCurrency(employee.total_compensation)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                                            No employees found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
