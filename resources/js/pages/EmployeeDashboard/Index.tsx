import { CustomComboBox } from '@/components/CustomComboBox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/standard-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Banknote,
    Calendar,
    Calculator,
    CheckCircle2,
    Clock,
    Coins,
    CreditCard,
    DollarSign,
    Download,
    FileText,
    Landmark,
    Loader2,
    LucideIcon,
    MapPin,
    Percent,
    Printer,
    Receipt,
    ScrollText,
    TrendingDown,
    TrendingUp,
    User,
    UserPen,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

interface EmployeeData {
    id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    image_path: string | null;
    position: string;
    is_rata_eligible: boolean;
    office: { id: number; name: string; code?: string };
    employment_status: { id: number; name: string };
    latest_salary?: { amount: number } | null;
    latest_pera?: { amount: number } | null;
    latest_rata?: { amount: number } | null;
    latest_hazard_pay?: { amount: number } | null;
    latest_clothing_allowance?: { amount: number } | null;
    salaries?: { id: number; amount: number; effective_date: string }[];
    peras?: { id: number; amount: number; effective_date: string }[];
    ratas?: { id: number; amount: number; effective_date: string }[];
    hazard_pays?: { id: number; amount: number; start_date: string; end_date?: string | null }[];
    clothing_allowances?: { id: number; amount: number; start_date: string; end_date?: string | null }[];
    created_at?: string;
}

interface PayrollPeriod {
    period: { year: number; month: number };
    salary: number;
    pera: number;
    rata: number;
    hazardPay: number;
    clothingAllowance: number;
    grossPay: number;
    totalDeductions: number;
    totalAdjustments: number;
    netPay: number;
    deductions: any[];
    adjustments: any[];
}

interface DashboardTotals {
    totalDeductions: number;
    totalClaims: number;
    totalAdjustments: number;
    deductionCount: number;
    claimCount: number;
    adjustmentCount: number;
}

interface EmployeeDashboardProps {
    employee: EmployeeData;
    deductions: Record<string, any[]>;
    claims: Record<string, any[]>;
    adjustments: Record<string, any[]>;
    payrollSummaries: Record<string, PayrollPeriod>;
    totals: DashboardTotals;
    availableYears: number[];
    filters: {
        month: string | null;
        year: string | null;
    };
    pagination: {
        currentPage: number;
        totalPages: number;
        total: number;
        perPage: number;
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₱0';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
};

const formatCompact = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₱0';
    if (amount >= 1000000) return '₱' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return '₱' + (amount / 1000).toFixed(1) + 'K';
    return formatCurrency(amount);
};

const getInitials = (emp: EmployeeData): string => {
    const f = (emp.first_name?.[0] || '').toUpperCase();
    const l = (emp.last_name?.[0] || '').toUpperCase();
    return f + l;
};

const getPeriodLabel = (period: string): string => {
    const [year, month] = period.split('-');
    return `${MONTHS[parseInt(month) - 1]} ${year}`;
};

const getSuffix = (emp: EmployeeData): string => {
    return emp.suffix ? `, ${emp.suffix}` : '';
};

const getAmountValue = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'object' && 'amount' in val) return isNaN(val.amount) ? 0 : Number(val.amount);
    return 0;
};

// ─── Stat Card Component ─────────────────────────────────────────────

function StatCard({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
}: {
    title: string;
    value: string;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'emerald' | 'teal';
    subtitle?: string;
}) {
    const colorMap = {
        blue: 'from-blue-500/10 to-blue-600/5 border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400',
        green: 'from-green-500/10 to-green-600/5 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400',
        amber: 'from-amber-500/10 to-amber-600/5 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400',
        purple: 'from-purple-500/10 to-purple-600/5 border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400',
        red: 'from-red-500/10 to-red-600/5 border-red-200 text-red-700 dark:border-red-800 dark:text-red-400',
        emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400',
        teal: 'from-teal-500/10 to-teal-600/5 border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-400',
    };

    return (
        <Card className={`border bg-gradient-to-br ${colorMap[color]} shadow-sm transition-all duration-200 hover:shadow-md`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold tracking-wider uppercase">{title}</CardTitle>
                <Icon className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                {subtitle && <p className="mt-1 text-xs opacity-60">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}

// ─── Quick Action Button ─────────────────────────────────────────────

function QuickAction({ title, description, icon: Icon, href, color }: { title: string; description: string; icon: LucideIcon; href: string; color: string }) {
    return (
        <Link
            href={href}
            className={`group relative flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${color}`}
        >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
        </Link>
    );
}

// ─── Payroll Card Component ──────────────────────────────────────────

function PayrollCard({ period, data }: { period: string; data: PayrollPeriod }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card className="overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b bg-gradient-to-r from-slate-50 to-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                        <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">{getPeriodLabel(period)}</p>
                        <p className="text-xs text-slate-500">Payroll Period</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500">Net Pay</p>
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(data.netPay)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="shrink-0">
                        {expanded ? 'Less' : 'Details'}
                    </Button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
                <div className="bg-white p-3">
                    <p className="text-xs text-slate-500">Basic Salary</p>
                    <p className="text-sm font-semibold">{formatCurrency(data.salary)}</p>
                </div>
                <div className="bg-white p-3">
                    <p className="text-xs text-slate-500">PERA</p>
                    <p className="text-sm font-semibold text-emerald-600">+ {formatCurrency(data.pera)}</p>
                </div>
                <div className="bg-white p-3">
                    <p className="text-xs text-slate-500">RATA</p>
                    <p className="text-sm font-semibold text-emerald-600">+ {formatCurrency(data.rata)}</p>
                </div>
                <div className="bg-white p-3">
                    <p className="text-xs text-slate-500">Gross Pay</p>
                    <p className="text-sm font-semibold text-blue-600">{formatCurrency(data.grossPay)}</p>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t bg-slate-50/50 p-4 space-y-4">
                    {/* Deductions */}
                    {data.deductions.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-wider text-red-600 uppercase">Deductions</p>
                            <div className="space-y-1">
                                {data.deductions.map((d: any) => (
                                    <div key={d.id} className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-sm">
                                        <span>{d.deduction_type?.name || 'Unknown'}</span>
                                        <span className="font-medium text-red-600">- {formatCurrency(getAmountValue(d.amount))}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex items-center justify-between rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold">
                                <span>Total Deductions</span>
                                <span className="text-red-700">- {formatCurrency(data.totalDeductions)}</span>
                            </div>
                        </div>
                    )}

                    {/* Adjustments */}
                    {data.adjustments.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-wider text-purple-600 uppercase">Adjustments</p>
                            <div className="space-y-1">
                                {data.adjustments.map((a: any) => (
                                    <div key={a.id} className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-sm">
                                        <span>{a.adjustment_type?.name || 'Unknown'}</span>
                                        <span className={`font-medium ${parseFloat(a.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(getAmountValue(a.amount))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex items-center justify-between rounded-md bg-purple-50 px-3 py-1.5 text-sm font-semibold">
                                <span>Total Adjustments</span>
                                <span className="text-purple-700">{formatCurrency(data.totalAdjustments)}</span>
                            </div>
                        </div>
                    )}

                    {/* Net Pay Summary */}
                    <div className="flex items-center justify-between rounded-lg border bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3">
                        <div>
                            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">Net Pay</p>
                            <p className="text-sm text-emerald-600">After all deductions & adjustments</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">{formatCurrency(data.netPay)}</p>
                    </div>
                </div>
            )}
        </Card>
    );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function EmployeeDashboard({
    employee,
    deductions,
    claims,
    adjustments,
    payrollSummaries,
    totals,
    availableYears,
    filters,
    pagination,
}: EmployeeDashboardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'deductions' | 'claims' | 'adjustments'>('overview');
    const filterApplied = filters.month || filters.year;

    const handleFilterChange = (key: string, value: string | null) => {
        router.get(route('employee.dashboard'), { ...filters, [key]: value || undefined, page: 1 }, { preserveState: true, preserveScroll: true });
    };

    const handlePageChange = (newPage: number) => {
        router.get(route('employee.dashboard'), { ...filters, page: newPage }, { preserveState: true, preserveScroll: true });
    };

    const handlePrint = (period: string, type: string) => {
        const [year, month] = period.split('-');
        window.open(route('employees.print', { employee: employee.id, month, year, type }), '_blank');
    };

    // ── Render: Deductions Tab ────────────────────────────────────
    const renderDeductions = () => {
        const entries = Object.entries(deductions);
        if (entries.length === 0) return <EmptyState icon={TrendingDown} title="No Deductions" message="No deduction records found for the selected period." />;

        return (
            <div className="space-y-4">
                {entries.map(([period, items]: [string, any]) => (
                    <Card key={period} className="overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-slate-500" />
                                <span className="font-medium text-sm">{getPeriodLabel(period)}</span>
                                <Badge variant="secondary" className="text-xs">{items.length} items</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-600">
                                    Total: <span className="font-semibold text-red-600">{formatCurrency(items.reduce((s: number, i: any) => s + getAmountValue(i.amount), 0))}</span>
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => handlePrint(period, 'deductions')}>
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Deduction Type</TableHead>
                                    <TableHead className="w-32 text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((d: any) => (
                                    <TableRow key={d.id}>
                                        <TableCell className="font-medium">{d.deduction_type?.name || 'Unknown'}</TableCell>
                                        <TableCell className="text-right font-medium text-red-600">- {formatCurrency(getAmountValue(d.amount))}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                ))}
            </div>
        );
    };

    // ── Render: Claims Tab ────────────────────────────────────────
    const renderClaims = () => {
        const entries = Object.entries(claims);
        if (entries.length === 0) return <EmptyState icon={FileText} title="No Claims" message="No claim records found for the selected period." />;

        return (
            <div className="space-y-4">
                {entries.map(([period, items]: [string, any]) => (
                    <Card key={period} className="overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-500" />
                                <span className="font-medium text-sm">{getPeriodLabel(period)}</span>
                                <Badge variant="secondary" className="text-xs">{items.length} items</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-600">
                                    Total: <span className="font-semibold text-emerald-600">{formatCurrency(items.reduce((s: number, i: any) => s + getAmountValue(i.amount), 0))}</span>
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => handlePrint(period, 'claims')}>
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="w-32 text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((c: any) => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <Badge variant={c.claim_type?.code === 'TRAVEL' ? 'default' : c.claim_type?.code === 'OVERTIME' ? 'secondary' : 'outline'}>
                                                {c.claim_type?.name || c.claim_type?.code || 'Unknown'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {c.claim_date ? new Date(c.claim_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(getAmountValue(c.amount))}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                ))}
            </div>
        );
    };

    // ── Render: Adjustments Tab ────────────────────────────────────
    const renderAdjustments = () => {
        const entries = Object.entries(adjustments);
        if (entries.length === 0) return <EmptyState icon={Calculator} title="No Adjustments" message="No adjustment records found for the selected period." />;

        return (
            <div className="space-y-4">
                {entries.map(([period, items]: [string, any]) => (
                    <Card key={period} className="overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-slate-500" />
                                <span className="font-medium text-sm">{getPeriodLabel(period)}</span>
                                <Badge variant="secondary" className="text-xs">{items.length} items</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-600">
                                    Total: <span className="font-semibold text-purple-600">{formatCurrency(items.reduce((s: number, i: any) => s + getAmountValue(i.amount), 0))}</span>
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => handlePrint(period, 'adjustments')}>
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-32 text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((a: any) => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-medium">{a.adjustment_type?.name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <Badge variant={a.status === 'approved' ? 'default' : a.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                {a.status || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${getAmountValue(a.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(getAmountValue(a.amount))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                ))}
            </div>
        );
    };

    // ── Render: Overview Tab ──────────────────────────────────────
    const renderOverview = () => {
        const payrollEntries = Object.entries(payrollSummaries);

        return (
            <div className="space-y-8">
                {/* Payroll Summaries */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Payroll History</h3>
                        {payrollEntries.length > 0 && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('employees.print', { employee: employee.id })}>
                                    <Printer className="mr-2 h-4 w-4" /> Print All
                                </Link>
                            </Button>
                        )}
                    </div>

                    {payrollEntries.length === 0 ? (
                        <EmptyState icon={Wallet} title="No Payroll Data" message="No payroll records found for the selected period." />
                    ) : (
                        <div className="space-y-4">
                            {payrollEntries.map(([period, data]) => (
                                <PayrollCard key={period} period={period} data={data} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" disabled={pagination.currentPage === 1} onClick={() => handlePageChange(pagination.currentPage - 1)}>
                                Previous
                            </Button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                                <Button key={p} variant={p === pagination.currentPage ? 'default' : 'outline'} size="sm" onClick={() => handlePageChange(p)}>
                                    {p}
                                </Button>
                            ))}
                            <Button variant="outline" size="sm" disabled={pagination.currentPage === pagination.totalPages} onClick={() => handlePageChange(pagination.currentPage + 1)}>
                                Next
                            </Button>
                        </div>
                    )}
                </div>

                {/* All-time Statistics */}
                <div>
                    <h3 className="mb-4 text-lg font-semibold">All-Time Summary</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Deductions" value={formatCurrency(totals.totalDeductions)} icon={TrendingDown} color="red" subtitle={`${totals.deductionCount} transactions`} />
                        <StatCard title="Total Claims" value={formatCurrency(totals.totalClaims)} icon={FileText} color="blue" subtitle={`${totals.claimCount} submissions`} />
                        <StatCard title="Total Adjustments" value={formatCurrency(totals.totalAdjustments)} icon={Calculator} color="purple" subtitle={`${totals.adjustmentCount} entries`} />
                        <StatCard title="Net Financial Impact" value={formatCurrency(totals.totalClaims + totals.totalAdjustments - totals.totalDeductions)} icon={TrendingUp} color={totals.totalClaims + totals.totalAdjustments - totals.totalDeductions >= 0 ? 'emerald' : 'red'} subtitle="Claims + Adj - Deductions" />
                    </div>
                </div>
            </div>
        );
    };

    // ── Main Render ───────────────────────────────────────────────
    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
                <Head title="Employee Portal" />

                <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
                    {/* ============ PROFILE HEADER ============ */}
                    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 shadow-xl">
                        {/* Decorative elements */}
                        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

                        <div className="relative z-10 flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:gap-8">
                            {/* Avatar */}
                            <div className="flex shrink-0 justify-center lg:justify-start">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 blur-sm opacity-50" />
                                    <Avatar className="relative h-24 w-24 border-4 border-white/20 shadow-xl md:h-28 md:w-28">
                                        {employee.image_path ? (
                                            <AvatarImage src={employee.image_path} alt={`${employee.first_name} ${employee.last_name}`} className="object-cover" />
                                        ) : (
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-2xl font-bold text-white">
                                                {getInitials(employee)}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center lg:text-left">
                                <h1 className="text-2xl font-bold text-white md:text-3xl">
                                    {employee.first_name} {employee.middle_name?.[0] ? employee.middle_name[0] + '. ' : ''}{employee.last_name}
                                    {getSuffix(employee)}
                                </h1>
                                <p className="mt-1 text-lg text-slate-300">{employee.position}</p>
                                <div className="mt-3 flex flex-wrap justify-center gap-3 lg:justify-start">
                                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                                        <MapPin className="mr-1 h-3 w-3" />
                                        {employee.office?.name}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                                        <User className="mr-1 h-3 w-3" />
                                        {employee.employment_status?.name}
                                    </Badge>
                                    {employee.latest_salary && (
                                        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">
                                            <Wallet className="mr-1 h-3 w-3" />
                                            {formatCurrency(employee.latest_salary.amount)}/mo
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex shrink-0 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{formatCompact(totals.totalClaims)}</p>
                                    <p className="text-xs text-slate-400">Total Claims</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{formatCompact(totals.totalDeductions)}</p>
                                    <p className="text-xs text-slate-400">Deductions</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============ STATS CARDS ============ */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Basic Salary" value={formatCurrency(employee.latest_salary?.amount ?? 0)} icon={Banknote} color="blue" subtitle="Current monthly rate" />
                        <StatCard title="PERA" value={formatCurrency(employee.latest_pera?.amount ?? 0)} icon={Coins} color="green" subtitle="Monthly allowance" />
                        <StatCard title="RATA" value={formatCurrency(employee.is_rata_eligible ? (employee.latest_rata?.amount ?? 0) : 0)} icon={Landmark} color="amber" subtitle={employee.is_rata_eligible ? 'Monthly allowance' : 'Not eligible'} />
                        <StatCard title="Hazard Pay" value={formatCurrency(employee.latest_hazard_pay?.amount ?? 0)} icon={Shield} color="purple" subtitle={employee.latest_hazard_pay ? 'Current rate' : 'Not applicable'} />
                    </div>

                    {/* ============ QUICK ACTIONS ============ */}
                    <div>
                        <h2 className="mb-3 text-lg font-semibold text-slate-800">Quick Actions</h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <QuickAction
                                title="My Claims"
                                description="View and track your claim submissions"
                                icon={FileText}
                                href={route('employee.claims.index')}
                                color="hover:border-emerald-300 hover:bg-emerald-50/50"
                            />
                            <QuickAction
                                title="View Payslip"
                                description="Detailed payroll breakdown with PDF download"
                                icon={ScrollText}
                                href="/my/payslip"
                                color="hover:border-purple-300 hover:bg-purple-50/50"
                            />
                            <QuickAction
                                title="Edit Profile"
                                description="Update your personal information"
                                icon={UserPen}
                                href={route('employee.profile.edit')}
                                color="hover:border-amber-300 hover:bg-amber-50/50"
                            />
                        </div>
                    </div>

                    {/* ============ FILTERS ============ */}
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
                        <Calendar className="h-5 w-5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">Filter by:</span>
                        <CustomComboBox
                            key={`month-${filters.month}`}
                            items={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
                            placeholder="All Months"
                            value={filters.month || null}
                            onSelect={(value) => handleFilterChange('month', value)}
                            showClear
                            className="w-40"
                        />
                        <CustomComboBox
                            key={`year-${filters.year}`}
                            items={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
                            placeholder="All Years"
                            value={filters.year || null}
                            onSelect={(value) => handleFilterChange('year', value)}
                            showClear
                            className="w-40"
                        />
                        {filterApplied && (
                            <Button variant="ghost" size="sm" onClick={() => router.get(route('employee.dashboard'), {}, { preserveState: true })} className="text-xs">
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* ============ MAIN CONTENT TABS ============ */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <TabsList className="bg-slate-100">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-white">
                                    <Wallet className="mr-2 h-4 w-4" /> Overview
                                </TabsTrigger>
                                <TabsTrigger value="deductions" className="data-[state=active]:bg-white">
                                    <TrendingDown className="mr-2 h-4 w-4" /> Deductions
                                </TabsTrigger>
                                <TabsTrigger value="claims" className="data-[state=active]:bg-white">
                                    <FileText className="mr-2 h-4 w-4" /> Claims
                                </TabsTrigger>
                                <TabsTrigger value="adjustments" className="data-[state=active]:bg-white">
                                    <Calculator className="mr-2 h-4 w-4" /> Adjustments
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="overview" className="mt-6">
                            {renderOverview()}
                        </TabsContent>
                        <TabsContent value="deductions" className="mt-6">
                            {renderDeductions()}
                        </TabsContent>
                        <TabsContent value="claims" className="mt-6">
                            {renderClaims()}
                        </TabsContent>
                        <TabsContent value="adjustments" className="mt-6">
                            {renderAdjustments()}
                        </TabsContent>
                    </Tabs>
                </div>
                <Toaster position="top-right" />
            </div>
        </TooltipProvider>
    );
}

// ─── Empty State Component ──────────────────────────────────────────

function EmptyState({ icon: Icon, title, message }: { icon: LucideIcon; title: string; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Icon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
            <p className="mt-1 max-w-md text-center text-sm text-slate-500">{message}</p>
        </div>
    );
}

function Shield({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}
