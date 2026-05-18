import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Clock, FileText, Printer, Receipt, TrendingUp, User } from 'lucide-react';

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

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

interface Claim {
    id: number;
    claim_date: string;
    purpose: string;
    amount: number;
    claim_type: {
        code: string | null;
        name: string | null;
    };
    salary?: {
        id: number;
        amount: number;
        effective_date: string;
    };
}

interface Summary {
    total_claims: number;
    total_amount: number;
    travel_count: number;
    travel_amount: number;
    overtime_count: number;
    overtime_amount: number;
    other_count: number;
    other_amount: number;
}

interface Employee {
    id: number;
    name: string;
    position: string | null;
    office: string;
}

interface EmployeeDetailProps {
    employee: Employee;
    claims: Claim[];
    summary: Summary;
    filters: {
        month: string | null;
        year: number | null;
        type: string | null;
    };
}

export default function EmployeeClaimsDetail({ employee, claims, summary, filters }: EmployeeDetailProps) {
    const handleFilterChange = (key: string, value: any) => {
        router.get(
            route('claims.employee.detail', employee.id),
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

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => {
        const year = currentYear - i;
        return { value: year.toString(), label: year.toString() };
    });

    const getPeriodLabel = () => {
        const monthLabel = filters.month ? months.find((m) => m.value === filters.month)?.label : 'All Months';
        const yearLabel = filters.year || currentYear;
        return `${monthLabel} ${yearLabel}`;
    };

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title={`Claims - ${employee.name}`} />
            <div className="p-6">
                <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard'))}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
                            <p className="text-muted-foreground mt-1">
                                {employee.position} • {employee.office}
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => window.open(route('claims.employee.detail.print', { employee: employee.id, ...filters }), '_blank')}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-3">
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
                            <div className="text-2xl font-bold text-blue-600">{summary.travel_count}</div>
                            <p className="text-muted-foreground text-xs">{formatCurrency(summary.travel_amount)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overtime Claims</CardTitle>
                            <Clock className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{summary.overtime_count}</div>
                            <p className="text-muted-foreground text-xs">{formatCurrency(summary.overtime_amount)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Other Claims</CardTitle>
                            <TrendingUp className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.other_count}</div>
                            <p className="text-muted-foreground text-xs">{formatCurrency(summary.other_amount)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Claims History
                        </CardTitle>
                        <CardDescription>Detailed list of all claims for {getPeriodLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {claims.length > 0 ? (
                            <div className="w-full overflow-hidden rounded-sm border">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">#</th>
                                            <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Date</th>
                                            <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Type</th>
                                            <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Purpose</th>
                                            <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Salary Basis</th>
                                            <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {claims.map((claim, index) => (
                                            <tr key={claim.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="border px-3 py-2 text-center">
                                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="border px-3 py-2 text-sm">{formatDate(claim.claim_date)}</td>
                                                <td className="border px-3 py-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            claim.claim_type.code === 'TRAVEL'
                                                                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                                : claim.claim_type.code === 'OVERTIME'
                                                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                                                                  : ''
                                                        }
                                                    >
                                                        {claim.claim_type.name}
                                                    </Badge>
                                                </td>
                                                <td className="border px-3 py-2 text-sm">{claim.purpose}</td>
                                                <td className="text-muted-foreground border px-3 py-2 text-xs">
                                                    {claim.salary ? (
                                                        <span>
                                                            {formatCurrency(Number(claim.salary.amount))}
                                                            <span className="ml-1 text-[10px]">
                                                                (
                                                                {new Date(claim.salary.effective_date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                })}
                                                                )
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="border px-3 py-2 text-right text-sm font-semibold">{formatCurrency(claim.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted/50 border-t-2 font-bold">
                                            <td className="border px-3 py-2 text-right" colSpan={5}>
                                                TOTALS:
                                            </td>
                                            <td className="border px-3 py-2 text-right">{formatCurrency(summary.total_amount)}</td>
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
