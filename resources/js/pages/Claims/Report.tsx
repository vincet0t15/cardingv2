import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Clock, FileText, Printer, Receipt, TrendingUp, Users } from 'lucide-react';

const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const claimTypes = [
    { value: '', label: 'All Claims' },
    { value: 'travel', label: 'Travel Claims Only' },
    { value: 'overtime', label: 'Overtime Claims Only' },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface EmployeeClaims {
    id: number;
    name: string;
    office: string;
    total_amount: number;
    claim_count: number;
    travel_count: number;
    travel_amount: number;
    overtime_count: number;
    overtime_amount: number;
    other_count: number;
    other_amount: number;
}

interface Summary {
    total_employees: number;
    total_claims: number;
    total_amount: number;
    total_travel_claims: number;
    total_travel_amount: number;
    total_overtime_claims: number;
    total_overtime_amount: number;
}

interface ReportProps {
    employees: EmployeeClaims[];
    summary: Summary;
    offices: {
        id: number;
        name: string;
    }[];
    filters: {
        month: string | null;
        year: number | null;
        type: string | null;
        office: string | null;
    };
}

export default function ClaimsReport({ employees, summary, offices, filters }: ReportProps) {
    const handleFilterChange = (key: string, value: any) => {
        router.get(
            route('claims.report'),
            {
                ...filters,
                [key]: value || null,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Dynamic year range: fixed start year (2020) to current year + 5
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 5;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).map((year) => ({
        value: year.toString(),
        label: year.toString(),
    }));

    const officeItems = [{ value: '', label: 'All Offices' }, ...offices.map((office) => ({ value: office.id.toString(), label: office.name }))];

    const getPeriodLabel = () => {
        const monthLabel = filters.month ? months.find((m) => m.value === filters.month)?.label : 'All Months';
        const yearLabel = filters.year || currentYear;
        return `${monthLabel} ${yearLabel}`;
    };

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title="Claims Report" />
            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Claims Report</h1>
                        <p className="text-muted-foreground mt-1">Comprehensive view of all employee claims with travel and overtime breakdown</p>
                    </div>
                    <Button onClick={() => window.open(route('claims.report.print', filters), '_blank')}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Month</label>
                                <CustomComboBox
                                    items={months}
                                    placeholder="Select month"
                                    value={filters.month || null}
                                    onSelect={(value) => handleFilterChange('month', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Year</label>
                                <CustomComboBox
                                    items={years}
                                    placeholder="Select year"
                                    value={(filters.year || currentYear).toString()}
                                    onSelect={(value) => handleFilterChange('year', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Office</label>
                                <CustomComboBox
                                    items={officeItems}
                                    placeholder="Select office"
                                    value={filters.office || null}
                                    onSelect={(value) => handleFilterChange('office', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Claim Type</label>
                                <CustomComboBox
                                    items={claimTypes}
                                    placeholder="Select type"
                                    value={filters.type || null}
                                    onSelect={(value) => handleFilterChange('type', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_employees}</div>
                            <p className="text-muted-foreground text-xs">With claims in {getPeriodLabel()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                            <FileText className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_claims}</div>
                            <p className="text-muted-foreground text-xs">{formatCurrency(summary.total_amount)} total</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Travel Claims</CardTitle>
                            <Receipt className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{summary.total_travel_claims}</div>
                            <p className="text-muted-foreground text-xs">{formatCurrency(summary.total_travel_amount)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overtime Claims</CardTitle>
                            <Clock className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{summary.total_overtime_claims}</div>
                            <p className="text-muted-foreground text-xs">{formatCurrency(summary.total_overtime_amount)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Employee Claims Breakdown
                        </CardTitle>
                        <CardDescription>Detailed breakdown of claims by employee for {getPeriodLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {employees.length > 0 ? (
                            <div className="w-full overflow-hidden rounded-sm border">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">#</th>
                                            <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Employee</th>
                                            <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Office</th>
                                            <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">
                                                Total Claims
                                            </th>
                                            <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">
                                                Total Amount
                                            </th>
                                            <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">Travel</th>
                                            <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">Overtime</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((employee, index) => (
                                            <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="border px-3 py-2 text-center">
                                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="border px-3 py-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{employee.name}</span>
                                                        <span className="text-muted-foreground text-xs">{employee.claim_count} claims</span>
                                                    </div>
                                                </td>
                                                <td className="border px-3 py-2">
                                                    <p className="text-muted-foreground truncate text-sm" title={employee.office}>
                                                        {employee.office}
                                                    </p>
                                                </td>
                                                <td className="border px-3 py-2 text-right">
                                                    <span className="text-sm font-semibold">{employee.claim_count}</span>
                                                </td>
                                                <td className="border px-3 py-2 text-right">
                                                    <span className="text-sm font-semibold">{formatCurrency(employee.total_amount)}</span>
                                                </td>
                                                <td className="border px-3 py-2 text-right">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                                    >
                                                        {employee.travel_count} • {formatCurrency(employee.travel_amount)}
                                                    </Badge>
                                                </td>
                                                <td className="border px-3 py-2 text-right">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
                                                    >
                                                        {employee.overtime_count} • {formatCurrency(employee.overtime_amount)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted/50 border-t-2 font-bold">
                                            <td className="border px-3 py-2 text-right" colSpan={3}>
                                                TOTALS:
                                            </td>
                                            <td className="border px-3 py-2 text-right">{summary.total_claims}</td>
                                            <td className="border px-3 py-2 text-right">{formatCurrency(summary.total_amount)}</td>
                                            <td className="border px-3 py-2 text-right">
                                                {summary.total_travel_claims} • {formatCurrency(summary.total_travel_amount)}
                                            </td>
                                            <td className="border px-3 py-2 text-right">
                                                {summary.total_overtime_claims} • {formatCurrency(summary.total_overtime_amount)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <FileText className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-muted-foreground text-sm">No claims data found for the selected filters</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
