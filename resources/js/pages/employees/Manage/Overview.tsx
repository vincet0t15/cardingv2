import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomComboBox } from '@/components/CustomComboBox';
import { Separator } from '@/components/ui/separator';
import type { Adjustment } from '@/types';
import type { Claim } from '@/types/claim';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { Building2, CalendarDays, CoinsIcon, CreditCard, DollarSign, HardHat, Receipt, Shirt, TrendingDown, TrendingUp, User, X } from 'lucide-react';
import { useState } from 'react';

interface OverviewProps {
    employee: Employee;
    deductions: Record<string, EmployeeDeduction[]>;
    claims: Claim[];
    totalDeductionsAllTime: number;
    totalClaimsAllTime: number;
    adjustments?: Adjustment[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function Overview({ employee, deductions, claims, totalDeductionsAllTime, totalClaimsAllTime, adjustments = [] }: OverviewProps) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentPeriodKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const availableDeductionPeriods = Object.keys(deductions || {});
    const latestDeductionPeriod = availableDeductionPeriods.sort().reverse()[0] || null;

    const claimsByPeriod = claims.reduce((acc, c) => {
        const d = new Date(c.claim_date);
        const periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[periodKey]) acc[periodKey] = [];
        acc[periodKey].push(c);
        return acc;
    }, {} as Record<string, typeof claims>);
    const availableClaimPeriods = Object.keys(claimsByPeriod);
    const latestClaimPeriod = availableClaimPeriods.sort().reverse()[0] || null;

    const allAvailablePeriods = [...new Set([...availableDeductionPeriods, ...availableClaimPeriods])].sort().reverse();
    const availableYears = [...new Set(allAvailablePeriods.map(p => p.split('-')[0]))].sort().reverse();

    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const selectedPeriodKey = selectedYear && selectedMonth
        ? `${selectedYear}-${selectedMonth.padStart(2, '0')}`
        : null;

    const displayPeriodKey = selectedPeriodKey || latestDeductionPeriod || currentPeriodKey;
    const displayDeductions = deductions[displayPeriodKey] ?? [];

    const displayClaims = selectedPeriodKey
        ? claimsByPeriod[displayPeriodKey] ?? []
        : (latestClaimPeriod ? claimsByPeriod[latestClaimPeriod] : []);

    const displayDeductionTotal = displayDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
    const displayClaimsTotal = displayClaims.reduce((sum, c) => sum + Number(c.amount), 0);

    const displayPeriodLabel = displayPeriodKey
        ? `${MONTHS[parseInt(displayPeriodKey.split('-')[1]) - 1]} ${displayPeriodKey.split('-')[0]}`
        : `${MONTHS[currentMonth - 1]} ${currentYear}`;

    const filteredMonthOptions = selectedYear
        ? allAvailablePeriods
            .filter(p => p.startsWith(selectedYear))
            .map(p => ({ value: p.split('-')[1], label: MONTHS[parseInt(p.split('-')[1]) - 1] }))
        : [];

    const hasActiveFilters = selectedYear || selectedMonth;
    const clearFilters = () => {
        setSelectedYear(null);
        setSelectedMonth(null);
    };

    const grossPay =
        Number(employee.latest_salary?.amount ?? 0) +
        Number(employee.latest_pera?.amount ?? 0) +
        (employee.is_rata_eligible ? Number(employee.latest_rata?.amount ?? 0) : 0) +
        Number(employee.latest_hazard_pay?.amount ?? 0) +
        Number(employee.latest_clothing_allowance?.amount ?? 0);
    const netPay = grossPay - displayDeductionTotal;

    const hireDate =
        employee.earliest_salary?.effective_date ??
        (employee.salaries && employee.salaries.length ? employee.salaries[employee.salaries.length - 1].effective_date : employee.created_at);
    const yearsOfService = hireDate ? Math.floor((new Date().getTime() - new Date(hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

    const recentClaims = displayClaims.slice(0, 5);
    const recentAdjustments = adjustments.slice(0, 5);

    const getAdjustmentTypeName = (adjustment: Adjustment) => {
        if (adjustment.adjustmentType?.name) {
            return adjustment.adjustmentType.name;
        }

        if (typeof adjustment.adjustment_type === 'string') {
            return adjustment.adjustment_type;
        }

        const adjustmentTypeObject = adjustment.adjustment_type as unknown as { name?: string } | null;
        if (adjustmentTypeObject && typeof adjustmentTypeObject === 'object') {
            return adjustmentTypeObject.name ?? 'Adjustment';
        }

        return 'Adjustment';
    };

    return (
        <div className="space-y-6">
            {/* Period Filter */}
            <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>Filter by Period:</span>
                </div>
                <CustomComboBox
                    items={availableYears.map(y => ({ value: y, label: y }))}
                    placeholder="All Years"
                    value={selectedYear}
                    onSelect={(value) => {
                        setSelectedYear(value);
                        setSelectedMonth(null);
                    }}
                />
                {selectedYear && (
                    <CustomComboBox
                        items={filteredMonthOptions}
                        placeholder="All Months"
                        value={selectedMonth}
                        onSelect={(value) => setSelectedMonth(value)}
                    />
                )}
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
                <div className="flex-1" />
                {selectedPeriodKey && (
                    <Badge variant="outline" className="text-xs">
                        Showing: {displayPeriodLabel}
                    </Badge>
                )}
            </div>

            {/* Compensation Summary Cards */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Current Compensation</h3>
                    <Badge variant="outline" className="text-xs">
                        Gross: {formatCurrency(grossPay)}
                    </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <Card className="rounded-md border-blue-200 bg-blue-50 p-5 text-blue-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Basic Salary</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                                <CoinsIcon className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-2xl font-bold">{formatCurrency(employee.latest_salary?.amount)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Effective {formatDate(employee.latest_salary?.effective_date)}</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-md border-green-200 bg-green-50 p-5 text-green-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">PERA</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
                                <CreditCard className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-2xl font-bold">{formatCurrency(employee.latest_pera?.amount)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Effective {formatDate(employee.latest_pera?.effective_date)}</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-md border-purple-200 bg-purple-50 p-5 text-purple-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">RATA</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
                                <CreditCard className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            {employee.is_rata_eligible ? (
                                <>
                                    <div className="text-2xl font-bold">{formatCurrency(employee.latest_rata?.amount)}</div>
                                    <p className="text-muted-foreground mt-1 text-xs">Effective {formatDate(employee.latest_rata?.effective_date)}</p>
                                </>
                            ) : (
                                <>
                                    <div className="text-muted-foreground text-2xl font-bold">N/A</div>
                                    <p className="text-muted-foreground mt-1 text-xs">Not RATA eligible</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-md border-orange-200 bg-orange-50 p-5 text-orange-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Hazard Pay</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30">
                                <HardHat className="h-4 w-4 text-orange-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-2xl font-bold">{formatCurrency(employee.latest_hazard_pay?.amount)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {employee.latest_hazard_pay?.start_date
                                    ? formatDate(employee.latest_hazard_pay.start_date) +
                                      (employee.latest_hazard_pay.end_date ? ` - ${formatDate(employee.latest_hazard_pay.end_date)}` : ' - Present')
                                    : 'N/A'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-md border-pink-200 bg-pink-50 p-5 text-pink-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Clothing Allow.</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pink-100 dark:bg-pink-900/30">
                                <Shirt className="h-4 w-4 text-pink-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="text-2xl font-bold">{formatCurrency(employee.latest_clothing_allowance?.amount)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {employee.latest_clothing_allowance?.start_date
                                    ? formatDate(employee.latest_clothing_allowance.start_date) +
                                      (employee.latest_clothing_allowance.end_date
                                          ? ` - ${formatDate(employee.latest_clothing_allowance.end_date)}`
                                          : ' - Present')
                                    : 'N/A'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-6">
                    {/* Summary */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Summary</h3>
                            <Badge variant="outline" className="text-xs">
                                {displayPeriodLabel}
                            </Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="rounded-md border-red-200 p-5 text-red-800 shadow-sm">
                                <CardHeader className="flex items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Deductions</CardTitle>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    </div>
                                </CardHeader>
                                <CardContent className="bg-transparent">
                                    <div className="text-2xl font-bold text-red-600">{formatCurrency(displayDeductionTotal)}</div>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {displayDeductions.length} deduction{displayDeductions.length !== 1 ? 's' : ''}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-md border-emerald-200 bg-emerald-50 p-5 text-emerald-800 shadow-sm">
                                <CardHeader className="flex items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Claims</CardTitle>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                                        <Receipt className="h-4 w-4 text-emerald-600" />
                                    </div>
                                </CardHeader>
                                <CardContent className="bg-transparent">
                                    <div className="text-2xl font-bold text-emerald-700">{formatCurrency(displayClaimsTotal)}</div>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {displayClaims.length} claim{displayClaims.length !== 1 ? 's' : ''}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-md border-blue-200 bg-blue-50 p-5 text-blue-800 shadow-sm">
                                <CardHeader className="flex items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                                        <CoinsIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                </CardHeader>
                                <CardContent className="bg-transparent">
                                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(grossPay - displayDeductionTotal)}</div>
                                    <p className="text-muted-foreground mt-1 text-xs">After deductions</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Overview Totals */}
                    <Card className="rounded-md border-slate-200 bg-slate-50 p-5 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Period Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 bg-transparent sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-md border border-slate-200 bg-white p-4">
                                <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Gross Pay</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(grossPay)}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white p-4">
                                <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Deductions</p>
                                <p className="mt-2 text-lg font-semibold text-rose-600">{formatCurrency(displayDeductionTotal)}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white p-4">
                                <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Claims</p>
                                <p className="mt-2 text-lg font-semibold text-emerald-600">{formatCurrency(displayClaimsTotal)}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-white p-4">
                                <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Net Pay</p>
                                <p className="mt-2 text-lg font-semibold text-blue-700">{formatCurrency(grossPay - displayDeductionTotal)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deductions Breakdown */}
                    {displayDeductions.length > 0 && (
                        <Card className="rounded-md border-red-200 p-5 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <TrendingDown className="h-5 w-5 text-rose-600" />
                                    Deductions Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-md border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <span>{displayPeriodLabel}</span>
                                        <span>
                                            {displayDeductions.length} item{displayDeductions.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Total Deductions</p>
                                            <p className="text-2xl font-semibold text-rose-600">{formatCurrency(displayDeductionTotal)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Net after deductions</p>
                                            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(grossPay - displayDeductionTotal)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {displayDeductions.map((deduction) => {
                                        const amount = Number(deduction.amount);
                                        const percentage = grossPay > 0 ? (amount / grossPay) * 100 : 0;
                                        return (
                                            <div key={deduction.id} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm font-medium">
                                                    <span>{deduction.deduction_type?.name ?? '—'}</span>
                                                    <span className="text-rose-600">{formatCurrency(amount)}</span>
                                                </div>
                                                <div className="bg-muted h-2 overflow-hidden rounded-full">
                                                    <div className="h-full bg-rose-500" style={{ width: `${Math.min(percentage, 100)}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between text-sm font-semibold">
                                    <span>Total</span>
                                    <span className="text-rose-600">{formatCurrency(displayDeductionTotal)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Claims */}
                    {recentClaims.length > 0 && (
                        <Card className="rounded-md border-emerald-200 p-5 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Recent Claims</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    {recentClaims.map((claim) => (
                                        <div
                                            key={claim.id}
                                            className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-700"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="text-muted-foreground h-4 w-4" />
                                                    <span className="text-sm font-medium">{claim.claim_type?.name ?? 'Claim'}</span>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-xs">{claim.purpose}</p>
                                                <p className="text-muted-foreground mt-1 text-xs">{formatDate(claim.claim_date)}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-green-600">{formatCurrency(claim.amount)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Adjustments */}
                    {recentAdjustments.length > 0 && (
                        <Card className="rounded-md border-violet-200 p-5 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Recent Adjustments</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    {recentAdjustments.map((adj) => (
                                        <div
                                            key={adj.id}
                                            className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-700"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="text-muted-foreground h-4 w-4" />
                                                    <span className="text-sm font-medium">{getAdjustmentTypeName(adj)}</span>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-xs">{adj.reason}</p>
                                                <p className="text-muted-foreground mt-1 text-xs">{formatDate(adj.effectivity_date)}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-semibold ${Number(adj.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {Number(adj.amount) >= 0 ? '+' : ''}
                                                    {formatCurrency(adj.amount)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Compensation History */}
                    {employee.salaries && employee.salaries.length > 1 && (
                        <Card className="rounded-md border-blue-200 p-5 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Compensation History</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    {employee.salaries.slice(0, 5).map((salary, index) => {
                                        const prevSalary = employee.salaries?.[index + 1];
                                        const increase = prevSalary ? Number(salary.amount) - Number(prevSalary.amount) : 0;
                                        const increasePercent =
                                            prevSalary && Number(prevSalary.amount) > 0 ? (increase / Number(prevSalary.amount)) * 100 : 0;

                                        return (
                                            <div key={salary.id} className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium">{formatCurrency(salary.amount)}</div>
                                                    <div className="text-muted-foreground text-xs">Effective {formatDate(salary.effective_date)}</div>
                                                </div>
                                                {increase > 0 && (
                                                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                        +{formatCurrency(increase)} ({increasePercent.toFixed(1)}%)
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <Card className="rounded-md border-slate-200 p-5 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CalendarDays className="h-5 w-5 text-blue-600" />
                                Quick Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 bg-transparent">
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                <p className="text-muted-foreground text-xs uppercase">Years of Service</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">{yearsOfService} year{yearsOfService !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                <p className="text-muted-foreground text-xs uppercase">All-Time Deductions</p>
                                <p className="mt-1 text-xl font-semibold text-rose-600">{formatCurrency(totalDeductionsAllTime)}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                <p className="text-muted-foreground text-xs uppercase">All-Time Claims</p>
                                <p className="mt-1 text-xl font-semibold text-emerald-600">{formatCurrency(totalClaimsAllTime)}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                <p className="text-muted-foreground text-xs uppercase">Current Period</p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">{displayPeriodLabel}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Latest Deductions Period */}
                    {Object.keys(deductions).length > 0 && (
                        <Card className="rounded-md border-slate-200 p-5 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Latest Deductions Period</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {(() => {
                                    const latestKey = Object.keys(deductions)[0];
                                    const [year, month] = latestKey.split('-');
                                    const items = deductions[latestKey];
                                    const total = items.reduce((sum, d) => sum + Number(d.amount), 0);
                                    return (
                                        <div className="space-y-2">
                                            <p className="mb-3 text-sm font-semibold">
                                                {MONTHS[parseInt(month) - 1]} {year}
                                            </p>
                                            {items.map((d) => (
                                                <div key={d.id} className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{d.deduction_type?.name ?? '—'}</span>
                                                    <span className="font-medium text-red-600">{formatCurrency(Number(d.amount))}</span>
                                                </div>
                                            ))}
                                            <Separator className="my-2" />
                                            <div className="flex items-center justify-between text-sm font-semibold">
                                                <span>Total</span>
                                                <span className="text-red-600">{formatCurrency(total)}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    )}

                    {/* Employment Details */}
                    <Card className="rounded-md border-slate-200 p-5 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User className="h-5 w-5 text-blue-600" />
                                Employment Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 bg-transparent">
                            <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="text-muted-foreground h-4 w-4" />
                                    <span className="text-muted-foreground">Position</span>
                                </div>
                                <span className="text-sm font-semibold">{employee.position}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="text-muted-foreground h-4 w-4" />
                                    <span className="text-muted-foreground">Office</span>
                                </div>
                                <span className="text-sm font-semibold">{employee.office?.name ?? '—'}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarDays className="text-muted-foreground h-4 w-4" />
                                    <span className="text-muted-foreground">Status</span>
                                </div>
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                    {employee.employment_status?.name ?? '—'}
                                </Badge>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="text-muted-foreground h-4 w-4" />
                                    <span className="text-muted-foreground">RATA Eligible</span>
                                </div>
                                <Badge variant={employee.is_rata_eligible ? 'default' : 'secondary'}>
                                    {employee.is_rata_eligible ? 'Yes' : 'No'}
                                </Badge>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="flex items-center gap-2 text-sm">
                                    <CoinsIcon className="text-muted-foreground h-4 w-4" />
                                    <span className="text-muted-foreground">Source of Fund</span>
                                </div>
                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                    {employee.latest_salary?.source_of_fund_code?.code ?? 'Not Assigned'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Overview;