import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Claim } from '@/types/claim';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { Printer, Receipt, TrendingDown, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ReportsProps {
    employee: Employee;
    allDeductions: EmployeeDeduction[];
    allClaims: Claim[];
    adjustments?: any[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
}

// Helper function to get the effective amount for a specific period
function getEffectiveAmount(history: { amount: number; effective_date: string }[] | undefined, periodYear: number, periodMonth: number): number {
    if (!history || history.length === 0) return 0;

    const periodEndDate = new Date(periodYear, periodMonth, 0);
    const sortedHistory = [...history].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

    for (const record of sortedHistory) {
        const effectiveDate = new Date(record.effective_date);
        if (effectiveDate <= periodEndDate) {
            return Number(record.amount);
        }
    }

    return Number(sortedHistory[sortedHistory.length - 1]?.amount ?? 0);
}

// Helper function for date range allowances (hazard pay, clothing allowance)
function getEffectiveAmountForDateRange(
    history: { amount: number; start_date: string; end_date?: string }[] | undefined,
    periodYear: number,
    periodMonth: number,
): number {
    if (!history || history.length === 0) return 0;

    const periodStart = new Date(periodYear, periodMonth - 1, 1);
    const periodEnd = new Date(periodYear, periodMonth, 0); // Last day of month, 00:00
    periodEnd.setHours(23, 59, 59, 999); // Set to end of day

    const matched = history
        .filter((record) => {
            const startParts = record.start_date.split('-');
            const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));

            let endDate: Date | null = null;
            if (record.end_date) {
                const endParts = record.end_date.split('-');
                endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]), 23, 59, 59, 999);
            }

            const isActive = startDate <= periodEnd;
            const matches = endDate ? isActive && endDate >= periodStart : isActive;
            return matches;
        })
        .sort((a, b) => {
            const aParts = a.start_date.split('-');
            const bParts = b.start_date.split('-');
            return (
                new Date(parseInt(bParts[0]), parseInt(bParts[1]) - 1, parseInt(bParts[2])).getTime() -
                new Date(parseInt(aParts[0]), parseInt(aParts[1]) - 1, parseInt(aParts[2])).getTime()
            );
        })[0];

    return Number(matched?.amount ?? 0);
}

interface MonthlyDeductionRow {
    year: number;
    month: number;
    items: EmployeeDeduction[];
    total: number;
}

interface YearlyClaimRow {
    year: number;
    items: Claim[];
    total: number;
}

function Reports({ employee, allDeductions, allClaims, adjustments = [] }: ReportsProps) {
    const [filterMonth, setFilterMonth] = useState<string | null>(null);
    const [filterYear, setFilterYear] = useState<string | null>(null);

    // Extract available years from data
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        allDeductions.forEach((d) => years.add(d.pay_period_year));
        allClaims.forEach((c) => years.add(new Date(c.claim_date).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [allDeductions, allClaims]);

    // Filter deductions based on selected month/year
    const filteredDeductions = useMemo(() => {
        return allDeductions.filter((d) => {
            const monthMatch = !filterMonth || d.pay_period_month === parseInt(filterMonth);
            const yearMatch = !filterYear || d.pay_period_year === parseInt(filterYear);
            return monthMatch && yearMatch;
        });
    }, [allDeductions, filterMonth, filterYear]);

    // Filter claims based on selected month/year
    const filteredClaims = useMemo(() => {
        return allClaims.filter((c) => {
            const claimDate = new Date(c.claim_date);
            const monthMatch = !filterMonth || claimDate.getMonth() + 1 === parseInt(filterMonth);
            const yearMatch = !filterYear || claimDate.getFullYear() === parseInt(filterYear);
            return monthMatch && yearMatch;
        });
    }, [allClaims, filterMonth, filterYear]);

    // Group deductions by year-month
    const deductionsByPeriod: Record<string, MonthlyDeductionRow> = {};
    for (const d of filteredDeductions) {
        const key = `${d.pay_period_year}-${String(d.pay_period_month).padStart(2, '0')}`;
        if (!deductionsByPeriod[key]) {
            deductionsByPeriod[key] = { year: d.pay_period_year, month: d.pay_period_month, items: [], total: 0 };
        }
        deductionsByPeriod[key].items.push(d);
        deductionsByPeriod[key].total += Number(d.amount);
    }
    const deductionPeriods = Object.values(deductionsByPeriod).sort((a, b) => b.year - a.year || b.month - a.month);

    // Group deductions by year for yearly totals
    const deductionsByYear: Record<number, number> = {};
    for (const d of filteredDeductions) {
        deductionsByYear[d.pay_period_year] = (deductionsByYear[d.pay_period_year] ?? 0) + Number(d.amount);
    }

    // Group claims by year
    const claimsByYearMap: Record<number, YearlyClaimRow> = {};
    for (const c of filteredClaims) {
        const year = new Date(c.claim_date).getFullYear();
        if (!claimsByYearMap[year]) {
            claimsByYearMap[year] = { year, items: [], total: 0 };
        }
        claimsByYearMap[year].items.push(c);
        claimsByYearMap[year].total += Number(c.amount);
    }
    const claimYears = Object.values(claimsByYearMap).sort((a, b) => b.year - a.year);

    const totalAllDeductions = filteredDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalAllClaims = filteredClaims.reduce((sum, c) => sum + Number(c.amount), 0);

    // Filter adjustments by selected month/year
    const filteredAdjustments = useMemo(() => {
        return adjustments.filter((a: any) => {
            const monthMatch = !filterMonth || Number(a.pay_period_month) === parseInt(filterMonth);
            const yearMatch = !filterYear || Number(a.pay_period_year) === parseInt(filterYear);
            return monthMatch && yearMatch;
        });
    }, [adjustments, filterMonth, filterYear]);

    // Compute signed amount for an adjustment based on its type.effect
    const computeSignedAmount = (a: any) => {
        const amt = Number(a.amount) || 0;
        const effect = (
            (a.adjustmentType && a.adjustmentType.effect) ||
            (typeof a.adjustment_type === 'object' && a.adjustment_type?.effect) ||
            a.effect ||
            ''
        )
            .toString()
            .toLowerCase();

        if (effect.includes('neg') || effect === '-' || effect.includes('subtract')) {
            return -amt;
        }

        // Default: treat as positive (adds to net pay)
        return amt;
    };

    // Total adjustments for current filters (signed)
    const totalAdjustments = useMemo(() => {
        return filteredAdjustments.reduce((sum: number, a: any) => sum + computeSignedAmount(a), 0);
    }, [filteredAdjustments]);

    // Normalize and return an adjustment type display name (handles object or string shapes)
    const getAdjustmentTypeName = (a: any) => {
        if (!a) return '—';
        if (a.adjustmentType && typeof a.adjustmentType === 'object') return a.adjustmentType.name ?? '—';
        if (a.adjustment_type && typeof a.adjustment_type === 'object') return a.adjustment_type.name ?? '—';
        if (typeof a.adjustment_type === 'string') return a.adjustment_type;
        if (typeof a.adjustmentType === 'string') return a.adjustmentType;
        return '—';
    };

    // Normalize and return a reference type display name (handles object or string shapes)
    const getReferenceTypeName = (a: any) => {
        if (!a) return '—';
        if (a.referenceType && typeof a.referenceType === 'object') return a.referenceType.name ?? '—';
        if (a.reference_type && typeof a.reference_type === 'object') return a.reference_type.name ?? '—';
        if (typeof a.reference_type === 'string') return a.reference_type;
        if (typeof a.referenceType === 'string') return a.referenceType;
        return '—';
    };

    // Helper function to sum compensation across all periods
    function sumCompensation(history: { amount: number; effective_date: string }[] | undefined): number {
        if (!history || history.length === 0) return 0;
        return history.reduce((sum, record) => sum + Number(record.amount), 0);
    }

    // Helper function to sum compensation for a specific year
    function sumCompensationForYear(history: { amount: number; effective_date: string }[] | undefined, year: number): number {
        if (!history || history.length === 0) return 0;
        return history.reduce((sum, record) => {
            const recordYear = new Date(record.effective_date).getFullYear();
            return recordYear === year ? sum + Number(record.amount) : sum;
        }, 0);
    }

    // Determine which compensation values to show based on filters
    let salary: number;
    let pera: number;
    let rata: number;
    let hazardPay: number;
    let clothingAllowance: number;
    let showGrossAndNet: boolean = true;
    let isAllTimeView: boolean = false;
    let isYearlyView: boolean = false;

    if (filterMonth && filterYear) {
        salary = getEffectiveAmount(employee.salaries, parseInt(filterYear), parseInt(filterMonth));
        pera = getEffectiveAmount(employee.peras, parseInt(filterYear), parseInt(filterMonth));
        rata = employee.is_rata_eligible ? getEffectiveAmount(employee.ratas, parseInt(filterYear), parseInt(filterMonth)) : 0;
        hazardPay = getEffectiveAmountForDateRange(employee.hazard_pays, parseInt(filterYear), parseInt(filterMonth));
        clothingAllowance = getEffectiveAmountForDateRange(employee.clothing_allowances, parseInt(filterYear), parseInt(filterMonth));
        showGrossAndNet = true; // Specific period - calculations make sense
    } else if (filterYear) {
        // Year only - sum ALL records within that year
        salary = sumCompensationForYear(employee.salaries, parseInt(filterYear));
        pera = sumCompensationForYear(employee.peras, parseInt(filterYear));
        rata = employee.is_rata_eligible ? sumCompensationForYear(employee.ratas, parseInt(filterYear)) : 0;
        // For year view, sum date-range based records that fall in the year
        hazardPay = employee.hazard_pays
            ? employee.hazard_pays.reduce((sum, r) => {
                  const startYear = parseInt(r.start_date.split('-')[0]);
                  return startYear === parseInt(filterYear) ? sum + Number(r.amount) : sum;
              }, 0)
            : 0;
        clothingAllowance = employee.clothing_allowances
            ? employee.clothing_allowances.reduce((sum, r) => {
                  const startYear = parseInt(r.start_date.split('-')[0]);
                  return startYear === parseInt(filterYear) ? sum + Number(r.amount) : sum;
              }, 0)
            : 0;
        showGrossAndNet = true;
        isYearlyView = true;
    } else {
        // All time - sum ALL salary/pera/rata across all periods
        salary = sumCompensation(employee.salaries);
        pera = sumCompensation(employee.peras);
        rata = employee.is_rata_eligible ? sumCompensation(employee.ratas) : 0;
        // All-time sum for date-range based allowances
        hazardPay = employee.hazard_pays ? employee.hazard_pays.reduce((sum, r) => sum + Number(r.amount), 0) : 0;
        clothingAllowance = employee.clothing_allowances ? employee.clothing_allowances.reduce((sum, r) => sum + Number(r.amount), 0) : 0;
        showGrossAndNet = true; // Now we can show gross/net for all-time view
        isAllTimeView = true;
    }

    const grossPay = salary + pera + rata + hazardPay + clothingAllowance;
    const netPay = grossPay - totalAllDeductions + totalAdjustments;

    const hasActiveFilters = filterMonth || filterYear;

    const clearFilters = () => {
        setFilterMonth(null);
        setFilterYear(null);
    };

    const handlePrint = () => {
        const query = new URLSearchParams();
        if (filterMonth) query.append('month', filterMonth);
        if (filterYear) query.append('year', filterYear);
        window.open(`/employees/${employee.id}/print?${query.toString()}`, '_blank');
    };

    return (
        <div className="space-y-8">
            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <CustomComboBox
                    items={FULL_MONTHS.map((month, index) => ({ value: String(index + 1), label: month }))}
                    placeholder="All Months"
                    value={filterMonth}
                    onSelect={(value) => setFilterMonth(value)}
                />
                <CustomComboBox
                    items={availableYears.map((year) => ({ value: String(year), label: String(year) }))}
                    placeholder="All Years"
                    value={filterYear}
                    onSelect={(value) => setFilterYear(value)}
                />
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-1 h-4 w-4" />
                        Clear Filters
                    </Button>
                )}

                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Basic Salary</CardTitle>
                        <TrendingDown className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(salary)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">PERA</CardTitle>
                        <Receipt className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(pera)}</div>
                    </CardContent>
                </Card>

                {employee.is_rata_eligible && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">RATA</CardTitle>
                            <Receipt className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(rata)}</div>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-slate-200 bg-slate-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-800">Gross Pay</CardTitle>
                        <TrendingDown className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(grossPay)}</div>
                        {isAllTimeView && <p className="mt-1 text-xs text-slate-600">Sum of all periods</p>}
                        {isYearlyView && <p className="mt-1 text-xs text-slate-600">Total for {filterYear}</p>}
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Total Deductions</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{formatCurrency(totalAllDeductions)}</div>
                        <p className="mt-1 text-xs text-red-600">{filteredDeductions.length} deduction entries</p>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">Net Pay</CardTitle>
                        <Receipt className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{formatCurrency(netPay)}</div>
                        <p className="mt-1 text-xs text-green-600">Gross Pay - Deductions</p>
                        {isAllTimeView && <p className="mt-1 text-xs text-green-600">Sum of all periods</p>}
                        {isYearlyView && <p className="mt-1 text-xs text-green-600">Total for {filterYear}</p>}
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Total Claims</CardTitle>
                        <Receipt className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalAllClaims)}</div>
                        <p className="mt-1 text-xs text-blue-600">
                            {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} recorded
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Period Breakdown - New Design */}
            <div className="space-y-4">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Period Breakdown</h3>

                {deductionPeriods.length === 0 ? (
                    <div className="text-muted-foreground rounded-sm border py-10 text-center text-sm">No deductions recorded.</div>
                ) : (
                    <div className="space-y-4">
                        {deductionPeriods.map((period) => {
                            // Get compensation for this specific period
                            const periodSalary = getEffectiveAmount(employee.salaries, period.year, period.month);
                            const periodPera = getEffectiveAmount(employee.peras, period.year, period.month);
                            const periodRata = employee.is_rata_eligible ? getEffectiveAmount(employee.ratas, period.year, period.month) : 0;
                            const periodHazardPay = getEffectiveAmountForDateRange(employee.hazard_pays, period.year, period.month);
                            const periodClothingAllowance = getEffectiveAmountForDateRange(employee.clothing_allowances, period.year, period.month);
                            const periodGrossPay = periodSalary + periodPera + periodRata + periodHazardPay + periodClothingAllowance;
                            const periodAdjustments = filteredAdjustments
                                .filter((a: any) => Number(a.pay_period_year) === period.year && Number(a.pay_period_month) === period.month)
                                .reduce((s: number, a: any) => s + computeSignedAmount(a), 0);

                            const periodNetPay = periodGrossPay - period.total + periodAdjustments;

                            return (
                                <div key={`${period.year}-${period.month}`} className="overflow-hidden rounded-lg border bg-white shadow-sm">
                                    {/* Header */}
                                    <div className="bg-muted/30 flex items-center justify-between border-b px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">
                                                {FULL_MONTHS[period.month - 1]} {period.year}
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                                {period.items.length} deduction{period.items.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                        <div className="text-sm">
                                            Net Pay: <span className="font-bold text-green-600">{formatCurrency(periodNetPay)}</span>
                                        </div>
                                    </div>

                                    {/* Deductions Table */}
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="font-semibold">Deduction Type</TableHead>
                                                <TableHead className="text-right font-semibold">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {period.items.map((d) => (
                                                <TableRow key={d.id}>
                                                    <TableCell className="uppercase">{d.deduction_type?.name ?? '—'}</TableCell>
                                                    <TableCell className="text-right text-red-600">-{formatCurrency(Number(d.amount))}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Summary Section */}
                                    <div className="bg-muted/20 border-t">
                                        <div className="grid grid-cols-2 divide-x">
                                            <div className="grid grid-cols-2">
                                                <div className="text-muted-foreground px-4 py-2 text-sm">Basic Salary</div>
                                                <div className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(periodSalary)}</div>
                                            </div>
                                            <div className="grid grid-cols-2">
                                                <div className="text-muted-foreground px-4 py-2 text-sm">PERA</div>
                                                <div className="px-4 py-2 text-right text-sm font-medium">+{formatCurrency(periodPera)}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x border-t">
                                            <div className="grid grid-cols-2">
                                                <div className="text-muted-foreground px-4 py-2 text-sm">RATA</div>
                                                <div className="px-4 py-2 text-right text-sm font-medium">
                                                    {employee.is_rata_eligible ? `+${formatCurrency(periodRata)}` : '-'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2">
                                                <div className="text-muted-foreground px-4 py-2 text-sm">Hazard Pay</div>
                                                <div className="px-4 py-2 text-right text-sm font-medium">+{formatCurrency(periodHazardPay)}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x border-t">
                                            <div className="grid grid-cols-2">
                                                <div className="text-muted-foreground px-4 py-2 text-sm">Clothing Allow.</div>
                                                <div className="px-4 py-2 text-right text-sm font-medium">
                                                    +{formatCurrency(periodClothingAllowance)}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 bg-blue-50">
                                                <div className="px-4 py-2 text-sm font-medium text-blue-800">Gross Pay</div>
                                                <div className="px-4 py-2 text-right font-bold text-blue-800">{formatCurrency(periodGrossPay)}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x border-t">
                                            <div className="grid grid-cols-2 bg-red-50">
                                                <div className="px-4 py-2 text-sm font-medium text-red-800">Total Deductions</div>
                                                <div className="px-4 py-2 text-right font-bold text-red-600">-{formatCurrency(period.total)}</div>
                                            </div>
                                            <div className="grid grid-cols-2 bg-green-50">
                                                <div className="px-4 py-2 text-sm font-medium text-green-800">Net Pay</div>
                                                <div className="px-4 py-2 text-right font-bold text-green-600">{formatCurrency(periodNetPay)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Adjustments Report */}
            <div className="space-y-4">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Adjustments</h3>

                {filteredAdjustments.length === 0 ? (
                    <div className="text-muted-foreground rounded-sm border py-10 text-center text-sm">
                        No adjustments recorded for the selected period.
                    </div>
                ) : (
                    <Card>
                        <CardContent>
                            <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                                <Table>
                                    <TableHeader className="bg-muted/90">
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Pay Period</TableHead>
                                            <TableHead>Effectivity</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAdjustments
                                            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                            .map((a: any) => (
                                                <TableRow key={a.id}>
                                                    <TableCell className="uppercase">{getAdjustmentTypeName(a)}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{getReferenceTypeName(a)}</TableCell>
                                                    <TableCell className="text-right text-red-600">{formatCurrency(Number(a.amount))}</TableCell>
                                                    <TableCell>{`${a.pay_period_year ?? '—'}-${String(a.pay_period_month ?? '—').padStart(2, '0')}`}</TableCell>
                                                    <TableCell>
                                                        {a.effectivity_date
                                                            ? new Date(a.effectivity_date).toLocaleDateString('en-PH', {
                                                                  month: 'short',
                                                                  day: 'numeric',
                                                                  year: 'numeric',
                                                              })
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                                        {a.reason ?? a.notes ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Claims Report */}
            <div className="space-y-4">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Claims by Year</h3>

                {claimYears.length === 0 ? (
                    <div className="text-muted-foreground rounded-sm border py-10 text-center text-sm">No claims recorded.</div>
                ) : (
                    <div className="space-y-4">
                        {claimYears.map((yearRow) => (
                            <Card key={yearRow.year}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm">{yearRow.year}</CardTitle>
                                    <span className="text-sm font-semibold text-green-600">{formatCurrency(yearRow.total)}</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/90">
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Purpose</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {yearRow.items
                                                    .sort((a, b) => new Date(b.claim_date).getTime() - new Date(a.claim_date).getTime())
                                                    .map((c) => (
                                                        <TableRow key={c.id}>
                                                            <TableCell className="whitespace-nowrap">
                                                                {new Date(c.claim_date).toLocaleDateString('en-PH', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="default">{c.claim_type?.name ?? '—'}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                                                {c.purpose}
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium text-green-600">
                                                                {formatCurrency(Number(c.amount))}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Reports;
