import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/standard-table';
import type { Adjustment } from '@/types';
import type { Claim } from '@/types/claim';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Baby,
    BadgeCheck,
    Building2,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    CoinsIcon,
    CreditCard,
    HardHat,
    MapPin,
    Phone,
    Receipt,
    Shirt,
    TrendingDown,
    TrendingUp,
    User,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface PeriodNetPaySummary {
    period: string;
    period_label: string;
    gross: number;
    deductions: number;
    net: number;
}

interface OverviewProps {
    employee: Employee;
    deductions: Record<string, EmployeeDeduction[]>;
    claims: Claim[];
    totalDeductionsAllTime: number;
    totalClaimsAllTime: number;
    totalGrossAllTime: number;
    periodNetPaySummaries?: PeriodNetPaySummary[];
    adjustments?: Adjustment[];
    availableYears?: number[];
}

const MONTHS = [
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

function formatCurrency(amount: number | undefined | null) {
    if (!amount) return '₱0.00';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(dateStr?: string | undefined) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    const day = d.getDate();
    const monthShort = d.toLocaleString('en-PH', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${monthShort} ${year}`;
}

function formatDateShort(dateStr?: string | undefined) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-PH', { month: 'short', year: 'numeric' });
}

// ─── Quick Preset Button ──────────────────────────────────────────────

function QuickPreset({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
        >
            {label}
        </button>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
}: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    color: 'blue' | 'emerald' | 'rose' | 'violet' | 'amber';
}) {
    const styles = {
        blue: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        rose: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300',
        violet: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
        amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
    };
    const iconBg = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400',
        violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    };

    return (
        <div
            className={`rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${styles[color]}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{title}</p>
                    <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
                    {subtitle && <p className="mt-0.5 text-xs opacity-60">{subtitle}</p>}
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

// ─── Compensation Bar ─────────────────────────────────────────────────

function CompensationBar({ label, amount, color }: { label: string; amount: number; color: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-4 py-2.5 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            <span className={`text-sm font-semibold ${color}`}>{formatCurrency(amount)}</span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────

function Overview({
    employee,
    deductions,
    claims,
    totalDeductionsAllTime,
    totalClaimsAllTime,
    totalGrossAllTime,
    periodNetPaySummaries = [],
    adjustments = [],
    availableYears = [],
}: OverviewProps) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Year options from available data + range
    const yearOptions = useMemo(() => {
        const allYears = [...availableYears];
        const currentYr = currentYear;
        if (!allYears.includes(currentYr)) allYears.push(currentYr);
        if (!allYears.includes(currentYr - 1)) allYears.push(currentYr - 1);
        allYears.sort((a, b) => b - a);
        return allYears.map((y) => ({ value: String(y), label: String(y) }));
    }, [availableYears, currentYear]);

    const { data: filterData, setData } = useForm({
        month: '',
        year: '',
    });

    const selectedYear = filterData.year;
    const selectedMonth = filterData.month;

    // Available periods from actual data
    const availablePeriods = useMemo(() => {
        const dedPeriods = Object.keys(deductions || {});
        const claimPeriods = claims.reduce((acc: string[], c) => {
            const pk = `${new Date(c.claim_date).getFullYear()}-${String(new Date(c.claim_date).getMonth() + 1).padStart(2, '0')}`;
            if (!acc.includes(pk)) acc.push(pk);
            return acc;
        }, []);
        return [...new Set([...dedPeriods, ...claimPeriods])].sort().reverse();
    }, [deductions, claims]);

    const displayPeriodKey =
        selectedYear && selectedMonth
            ? `${selectedYear}-${selectedMonth.padStart(2, '0')}`
            : '';

    const displayPeriodLabel =
        selectedYear && selectedMonth
            ? `${MONTHS[parseInt(selectedMonth) - 1].label} ${selectedYear}`
            : selectedYear
              ? `${selectedYear} (All Months)`
              : 'All Periods';

    // Filtered data
    const displayDeductions = useMemo(() => {
        if (!selectedYear && !selectedMonth) return Object.values(deductions || {}).flat();
        if (selectedYear && !selectedMonth) {
            return Object.entries(deductions || {}).reduce((acc: EmployeeDeduction[], [period, items]) => {
                if (period.startsWith(selectedYear)) acc.push(...items);
                return acc;
            }, []);
        }
        return deductions[displayPeriodKey] ?? [];
    }, [deductions, displayPeriodKey, selectedYear, selectedMonth]);

    const displayDeductionTotal = useMemo(
        () => displayDeductions.reduce((sum, d) => sum + Number(d.amount), 0),
        [displayDeductions],
    );

    const displayClaims = useMemo(() => {
        if (!selectedYear && !selectedMonth) return claims;
        if (selectedYear && !selectedMonth)
            return claims.filter((c) => new Date(c.claim_date).getFullYear().toString() === selectedYear);
        return claims.filter((c) => {
            const d = new Date(c.claim_date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === displayPeriodKey;
        });
    }, [claims, selectedYear, selectedMonth, displayPeriodKey]);

    const displayClaimsTotal = useMemo(
        () => displayClaims.reduce((sum, c) => sum + Number(c.amount), 0),
        [displayClaims],
    );

    // Financial summary
    const monthlySalary = Number(employee.latest_salary?.amount ?? 0);
    const monthlyPera = Number(employee.latest_pera?.amount ?? 0);
    const monthlyRata = employee.is_rata_eligible ? Number(employee.latest_rata?.amount ?? 0) : 0;
    const monthlyHazard = Number(employee.latest_hazard_pay?.amount ?? 0);
    const monthlyClothing = Number(employee.latest_clothing_allowance?.amount ?? 0);
    const grossPay = monthlySalary + monthlyPera + monthlyRata + monthlyHazard + monthlyClothing;

    // Month-by-Month Net Pay state
    const [netPayViewAll, setNetPayViewAll] = useState(false);
    const [netPayFilterMonth, setNetPayFilterMonth] = useState('');
    const [netPayFilterYear, setNetPayFilterYear] = useState('');
    const [netPayPage, setNetPayPage] = useState(1);
    const NET_PAY_PER_PAGE = 10;

    // Apply filters to period net pay summaries
    const filteredNetPay = useMemo(() => {
        let data = periodNetPaySummaries;
        if (netPayFilterYear) {
            data = data.filter((p) => p.period.startsWith(netPayFilterYear));
        }
        if (netPayFilterMonth) {
            data = data.filter((p) => p.period.endsWith(netPayFilterMonth.padStart(2, '0')));
        }
        return data;
    }, [periodNetPaySummaries, netPayFilterMonth, netPayFilterYear]);

    const displayedNetPay = netPayViewAll ? filteredNetPay : filteredNetPay.slice(0, 5);
    const totalNetPayPages = Math.max(1, Math.ceil(filteredNetPay.length / NET_PAY_PER_PAGE));
    const paginatedNetPay = displayedNetPay.slice(
        (netPayPage - 1) * NET_PAY_PER_PAGE,
        netPayPage * NET_PAY_PER_PAGE,
    );

    const hireDate =
        employee.earliest_salary?.effective_date ??
        (employee.salaries && employee.salaries.length > 0
            ? employee.salaries[employee.salaries.length - 1].effective_date
            : employee.created_at);
    const yearsOfService = hireDate
        ? Math.floor((new Date().getTime() - new Date(hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 0;

    const recentClaims = displayClaims.slice(0, 5);
    const recentAdjustments = adjustments.slice(0, 5);

    const getAdjustmentTypeName = (adj: Adjustment) => {
        if (adj.adjustmentType?.name) return adj.adjustmentType.name;
        if (typeof adj.adjustment_type === 'string') return adj.adjustment_type;
        const obj = adj.adjustment_type as unknown as { name?: string } | null;
        if (obj && typeof obj === 'object') return obj.name ?? 'Adjustment';
        return 'Adjustment';
    };

    const handleFilterChange = (field: 'month' | 'year', value: string) => {
        const newFilters = { ...filterData, [field]: value };
        setData(field, value);
        const params: Record<string, string> = {};
        if (newFilters.month) params.month = newFilters.month;
        if (newFilters.year) params.year = newFilters.year;
        router.get(window.location.pathname, Object.keys(params).length > 0 ? params : undefined, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const setQuickPeriod = (month: number | null, year: number | null) => {
        const params: Record<string, string> = {};
        if (month) {
            setData('month', String(month));
            params.month = String(month);
        } else {
            setData('month', '');
        }
        if (year) {
            setData('year', String(year));
            params.year = String(year);
        } else {
            setData('year', '');
        }
        router.get(window.location.pathname, Object.keys(params).length > 0 ? params : undefined, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const hasActiveFilter = selectedMonth || selectedYear;

    return (
        <div className="space-y-6">
            {/* ── Filter Bar ── */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Period</span>
                </div>
                <QuickPreset
                    label="All Time"
                    active={!hasActiveFilter}
                    onClick={() => setQuickPeriod(null, null)}
                />
                <QuickPreset
                    label="This Month"
                    active={selectedMonth === String(currentMonth) && selectedYear === String(currentYear)}
                    onClick={() => setQuickPeriod(currentMonth, currentYear)}
                />
                <QuickPreset
                    label="Last Month"
                    active={
                        selectedMonth === String(currentMonth === 1 ? 12 : currentMonth - 1) &&
                        selectedYear === String(currentMonth === 1 ? currentYear - 1 : currentYear)
                    }
                    onClick={() => {
                        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
                        setQuickPeriod(prevMonth, prevYear);
                    }}
                />
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
                <CustomComboBox
                    items={MONTHS}
                    placeholder="Month"
                    value={selectedMonth || null}
                    onSelect={(v) => handleFilterChange('month', v ?? '')}
                    showClear={true}
                    className="w-32"
                />
                <CustomComboBox
                    items={yearOptions}
                    placeholder="Year"
                    value={selectedYear || null}
                    onSelect={(v) => handleFilterChange('year', v ?? '')}
                    showClear={true}
                    className="w-28"
                />
                <div className="ml-auto">
                    <Badge variant="outline" className="bg-slate-50 text-xs dark:bg-slate-800">
                        {displayPeriodLabel}
                    </Badge>
                </div>
            </div>

            {/* ── Top Summary Row ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Gross Monthly"
                    value={formatCurrency(hasActiveFilter ? grossPay : totalGrossAllTime)}
                    subtitle={hasActiveFilter ? 'Current monthly rate' : 'All periods total (salary + allowances)'}
                    icon={Wallet}
                    color="blue"
                />
                <StatCard
                    title="Deductions"
                    value={formatCurrency(hasActiveFilter ? displayDeductionTotal : totalDeductionsAllTime)}
                    subtitle={hasActiveFilter ? 'This period' : 'All-time total'}
                    icon={TrendingDown}
                    color="rose"
                />
                <StatCard
                    title="Claims"
                    value={formatCurrency(hasActiveFilter ? displayClaimsTotal : totalClaimsAllTime)}
                    subtitle={hasActiveFilter ? 'This period' : 'All-time total'}
                    icon={Receipt}
                    color="emerald"
                />
                <StatCard
                    title="Net Monthly"
                    value={formatCurrency(
                        hasActiveFilter
                            ? grossPay - displayDeductionTotal
                            : totalGrossAllTime - totalDeductionsAllTime
                    )}
                    subtitle={hasActiveFilter ? 'After all deductions' : 'All-time net after deductions'}
                    icon={CoinsIcon}
                    color="violet"
                />
            </div>

            {/* ── Compensation Breakdown ── */}
            <Card className="overflow-hidden rounded-xl border shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 px-5 py-3 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <Wallet className="h-4 w-4 text-blue-600" />
                            Compensation Breakdown
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                            Gross: {formatCurrency(grossPay)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 p-5">
                    <CompensationBar label="Basic Salary" amount={monthlySalary} color="text-blue-600" />
                    <CompensationBar label="PERA" amount={monthlyPera} color="text-emerald-600" />
                    {monthlyRata > 0 && (
                        <CompensationBar label="RATA" amount={monthlyRata} color="text-purple-600" />
                    )}
                    {monthlyHazard > 0 && (
                        <CompensationBar label="Hazard Pay" amount={monthlyHazard} color="text-orange-600" />
                    )}
                    {monthlyClothing > 0 && (
                        <CompensationBar
                            label="Clothing Allowance"
                            amount={monthlyClothing}
                            color="text-pink-600"
                        />
                    )}
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-950/50">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Total Gross Pay
                        </span>
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                            {formatCurrency(grossPay)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* ── Month-by-Month Net Pay ── */}
            {periodNetPaySummaries.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-violet-600" />
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                Month-by-Month Net Pay
                            </h3>
                        </div>
                        {periodNetPaySummaries.length > 5 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setNetPayViewAll(!netPayViewAll);
                                    setNetPayPage(1);
                                }}
                            >
                                {netPayViewAll ? 'Show Less' : 'View All'}
                                {netPayViewAll ? (
                                    <ChevronUp className="ml-1 h-3 w-3" />
                                ) : (
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                )}
                            </Button>
                        )}
                    </div>

                    {netPayViewAll && (
                        <div className="flex flex-wrap items-center gap-3">
                            <CustomComboBox
                                items={MONTHS}
                                placeholder="All Months"
                                value={netPayFilterMonth || null}
                                onSelect={(v) => {
                                    setNetPayFilterMonth(v ?? '');
                                    setNetPayPage(1);
                                }}
                            />
                            <CustomComboBox
                                items={yearOptions}
                                placeholder="All Years"
                                value={netPayFilterYear || null}
                                onSelect={(v) => {
                                    setNetPayFilterYear(v ?? '');
                                    setNetPayPage(1);
                                }}
                            />
                            <span className="text-xs text-slate-400">
                                {filteredNetPay.length} {filteredNetPay.length === 1 ? 'period' : 'periods'}
                            </span>
                        </div>
                    )}

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead className="text-right">Gross Pay</TableHead>
                                    <TableHead className="text-right">Deductions</TableHead>
                                    <TableHead className="text-right">Net Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(netPayViewAll ? paginatedNetPay : displayedNetPay).length > 0 ? (
                                    (netPayViewAll ? paginatedNetPay : displayedNetPay).map((p) => (
                                        <TableRow key={p.period}>
                                            <TableCell className="font-medium">{p.period_label}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(p.gross)}</TableCell>
                                            <TableCell className="text-right text-rose-600">
                                                {formatCurrency(p.deductions)}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-medium ${
                                                    p.net >= 0 ? 'text-green-600' : 'text-rose-600'
                                                }`}
                                            >
                                                {formatCurrency(p.net)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4}>
                                            <div className="text-muted-foreground py-12 text-center text-sm">
                                                No data for the selected period.
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {netPayViewAll && totalNetPayPages > 1 && (
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-slate-500">
                                Page <strong>{netPayPage}</strong> of <strong>{totalNetPayPages}</strong>
                            </p>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={netPayPage <= 1}
                                    onClick={() => setNetPayPage((p) => Math.max(1, p - 1))}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={netPayPage >= totalNetPayPages}
                                    onClick={() => setNetPayPage((p) => Math.min(totalNetPayPages, p + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Main Grid ── */}
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* ── Pay Flow Visual ── */}
                    {hasActiveFilter && displayDeductions.length > 0 && (
                        <Card className="overflow-hidden rounded-xl border shadow-sm">
                            <CardHeader className="border-b bg-slate-50/50 px-5 py-3 dark:bg-slate-800/50">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    Pay Flow — {displayPeriodLabel}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                                            <ArrowDown className="h-4 w-4" />
                                            Gross Pay
                                        </div>
                                        <span className="text-lg font-bold text-emerald-700">
                                            {formatCurrency(grossPay)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-rose-800">
                                            <ArrowUp className="h-4 w-4" />
                                            Deductions
                                        </div>
                                        <span className="text-lg font-bold text-rose-600">
                                            -{formatCurrency(displayDeductionTotal)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-violet-800">
                                            <CoinsIcon className="h-4 w-4" />
                                            Net Pay
                                        </div>
                                        <span className="text-xl font-bold text-violet-700">
                                            {formatCurrency(grossPay - displayDeductionTotal)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Deductions Breakdown ── */}
                    {displayDeductions.length > 0 && (
                        <Card className="overflow-hidden rounded-xl border shadow-sm">
                            <CardHeader className="border-b bg-slate-50/50 px-5 py-3 dark:bg-slate-800/50">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <TrendingDown className="h-4 w-4 text-rose-600" />
                                    Deductions Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                                    <span>{displayPeriodLabel}</span>
                                    <span>
                                        {displayDeductions.length} item{displayDeductions.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {displayDeductions.map((deduction) => {
                                        const amount = Number(deduction.amount);
                                        const pct = grossPay > 0 ? (amount / grossPay) * 100 : 0;
                                        return (
                                            <div key={deduction.id} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {deduction.deduction_type?.name ?? '—'}
                                                    </span>
                                                    <span className="font-semibold text-rose-600">
                                                        {formatCurrency(amount)}
                                                    </span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Separator className="my-4" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        Total Deductions
                                    </span>
                                    <span className="text-lg font-bold text-rose-600">
                                        {formatCurrency(displayDeductionTotal)}
                                    </span>
                                </div>
                                {grossPay > 0 && (
                                    <div className="mt-1 text-right text-xs text-slate-400">
                                        {(displayDeductionTotal / grossPay) * 100}% of gross pay
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Recent Activity ── */}
                    {(recentClaims.length > 0 || recentAdjustments.length > 0) && (
                        <Card className="overflow-hidden rounded-xl border shadow-sm">
                            <CardHeader className="border-b bg-slate-50/50 px-5 py-3 dark:bg-slate-800/50">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <Receipt className="h-4 w-4 text-emerald-600" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="space-y-3">
                                    {recentClaims.map((claim) => (
                                        <div
                                            key={`claim-${claim.id}`}
                                            className="flex items-start justify-between rounded-lg border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                                                    <Receipt className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                        {claim.claim_type?.name ?? 'Claim'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{claim.purpose}</p>
                                                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(claim.claim_date)}</p>
                                                </div>
                                            </div>
                                            <div className="text-sm font-semibold text-emerald-600">
                                                {formatCurrency(claim.amount)}
                                            </div>
                                        </div>
                                    ))}
                                    {recentAdjustments.map((adj) => {
                                        const isPositive = Number(adj.amount) >= 0;
                                        return (
                                            <div
                                                key={`adj-${adj.id}`}
                                                className="flex items-start justify-between rounded-lg border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                                                            isPositive
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                                                                : 'bg-rose-100 dark:bg-rose-900/50'
                                                        }`}
                                                    >
                                                        <TrendingUp
                                                            className={`h-4 w-4 ${
                                                                isPositive ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                            {getAdjustmentTypeName(adj)}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{adj.reason}</p>
                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {formatDate(adj.effectivity_date)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`text-sm font-semibold ${
                                                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}
                                                >
                                                    {isPositive ? '+' : ''}
                                                    {formatCurrency(adj.amount)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Compensation History ── */}
                    {employee.salaries && employee.salaries.length > 1 && (
                        <Card className="overflow-hidden rounded-xl border shadow-sm">
                            <CardHeader className="border-b bg-slate-50/50 px-5 py-3 dark:bg-slate-800/50">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    Salary History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="space-y-3">
                                    {employee.salaries.slice(0, 6).map((salary, index) => {
                                        const prevSalary = employee.salaries?.[index + 1];
                                        const increase = prevSalary
                                            ? Number(salary.amount) - Number(prevSalary.amount)
                                            : 0;
                                        const increasePercent =
                                            prevSalary && Number(prevSalary.amount) > 0
                                                ? (increase / Number(prevSalary.amount)) * 100
                                                : 0;

                                        return (
                                            <div
                                                key={salary.id}
                                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                                            >
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                        {formatCurrency(salary.amount)}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {formatDateShort(salary.effective_date)}
                                                        {salary.source_of_fund_code && (
                                                            <span className="ml-2">
                                                                · {salary.source_of_fund_code.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {increase > 0 && (
                                                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                                        <ArrowUp className="mr-0.5 h-3 w-3" />
                                                        {formatCurrency(increase)} ({increasePercent.toFixed(1)}%)
                                                    </Badge>
                                                )}
                                                {increase < 0 && (
                                                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                                                        <ArrowDown className="mr-0.5 h-3 w-3" />
                                                        {formatCurrency(Math.abs(increase))}
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Empty State ── */}
                    {displayDeductions.length === 0 && recentClaims.length === 0 && recentAdjustments.length === 0 && (
                        <Card className="rounded-xl border border-dashed shadow-sm">
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <CoinsIcon className="h-7 w-7 text-slate-400" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                                    No Data for This Period
                                </h3>
                                <p className="mt-1 max-w-sm text-sm text-slate-500">
                                    {hasActiveFilter
                                        ? 'Try selecting a different period or "All Time" to view employee records.'
                                        : 'No deductions, claims, or adjustments recorded for this employee.'}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── Right Sidebar ── */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <Card className="overflow-hidden rounded-xl border shadow-sm">
                        <CardHeader className="border-b bg-slate-50/50 px-5 py-3 dark:bg-slate-800/50">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <BadgeCheck className="h-4 w-4 text-blue-600" />
                                Quick Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-5">
                            <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Years of Service
                                </p>
                                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                                    {yearsOfService} year{yearsOfService !== 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-slate-400">Since {formatDateShort(hireDate)}</p>
                            </div>
                            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 shadow-sm dark:border-rose-900 dark:bg-rose-950/50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">
                                    All-Time Deductions
                                </p>
                                <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-400">
                                    {formatCurrency(totalDeductionsAllTime)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                                    All-Time Claims
                                </p>
                                <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                    {formatCurrency(totalClaimsAllTime)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employment Info */}
                    <Card className="overflow-hidden rounded-xl border shadow-sm">
                        <CardHeader className="border-b bg-slate-50/50 px-5 py-3 dark:bg-slate-800/50">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <User className="h-4 w-4 text-violet-600" />
                                Employment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-5">
                            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                                    <User className="h-3.5 w-3.5" />
                                    Position
                                </p>
                                <p className="mt-1.5 text-base font-semibold text-slate-800 dark:text-slate-200">
                                    {employee.position}
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                                    <Building2 className="h-3.5 w-3.5" />
                                    Office / Department
                                </p>
                                <p className="mt-1.5 text-base font-semibold text-slate-800 dark:text-slate-200">
                                    {employee.office?.name ?? '—'}
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                                    <Building2 className="h-3.5 w-3.5" />
                                    Employment Status
                                </p>
                                <div className="mt-2">
                                    <Badge className="border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                        {employee.employment_status?.name ?? '—'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                                    <MapPin className="h-3.5 w-3.5" />
                                    RATA Eligibility
                                </p>
                                <div className="mt-2">
                                    <Badge
                                        variant={employee.is_rata_eligible ? 'default' : 'secondary'}
                                        className="px-3 py-1 text-sm"
                                    >
                                        {employee.is_rata_eligible ? 'Eligible' : 'Not Eligible'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                                    <CoinsIcon className="h-3.5 w-3.5" />
                                    Source of Fund
                                </p>
                                <div className="mt-2">
                                    <Badge className="border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
                                        {employee.latest_salary?.source_of_fund_code?.code ?? 'Not Assigned'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Info */}
                    {(employee.contact_number || employee.email || employee.address || employee.birthdate) && (
                        <Card className="overflow-hidden rounded-xl border shadow-sm">
                            <CardHeader className="border-b bg-slate-50/50 px-5 py-3 dark:bg-slate-800/50">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <Phone className="h-4 w-4 text-amber-600" />
                                    Contact & Personal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">
                                {employee.contact_number && (
                                    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                                        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                                            <Phone className="h-3.5 w-3.5" />
                                            Contact Number
                                        </p>
                                        <p className="mt-1.5 text-base font-semibold text-slate-800 dark:text-slate-200">
                                            {employee.contact_number}
                                        </p>
                                    </div>
                                )}
                                {employee.birthdate && (
                                    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
                                        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                                            <Baby className="h-3.5 w-3.5" />
                                            Birthdate
                                        </p>
                                        <p className="mt-1.5 text-base font-semibold text-slate-800 dark:text-slate-200">
                                            {formatDate(employee.birthdate)}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Overview;
