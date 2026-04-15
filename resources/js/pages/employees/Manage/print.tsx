import PrintFFooter from '@/components/print-footer';
import { Button } from '@/components/ui/button';
import type { Adjustment } from '@/types';
import type { Claim } from '@/types/claim';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface PrintReportPageProps {
    employee: Employee;
    allDeductions: EmployeeDeduction[];
    allClaims: Claim[];
    allAdjustments: Adjustment[];
    filterMonth?: string | null;
    filterYear?: string | null;
    printType?: 'all' | 'deductions' | 'claims';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
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
    if (!history || history.length === 0) {
        console.log('getEffectiveAmountForDateRange: No history data');
        return 0;
    }

    console.log('getEffectiveAmountForDateRange called with:', {
        historyLength: history.length,
        periodYear,
        periodMonth,
        firstRecord: history[0],
    });

    const periodStart = new Date(periodYear, periodMonth - 1, 1);
    const periodEnd = new Date(periodYear, periodMonth, 0, 23, 59, 59, 999);

    console.log('Period range:', {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
    });

    const effectiveRecord = history
        .filter((record) => {
            // Parse dates in local timezone to avoid UTC issues
            const startDateParts = record.start_date.split('-');
            const startDate = new Date(parseInt(startDateParts[0]), parseInt(startDateParts[1]) - 1, parseInt(startDateParts[2]));

            let endDate: Date | null = null;
            if (record.end_date) {
                const endDateParts = record.end_date.split('-');
                endDate = new Date(parseInt(endDateParts[0]), parseInt(endDateParts[1]) - 1, parseInt(endDateParts[2]), 23, 59, 59, 999);
            }

            // Check if the record's date range overlaps with the period
            const isActive = startDate <= periodEnd;
            const matches = endDate ? isActive && endDate >= periodStart : isActive;

            console.log('Record check:', {
                start_date: record.start_date,
                end_date: record.end_date,
                startDate: startDate.toLocaleDateString(),
                endDate: endDate?.toLocaleDateString(),
                isActive,
                matches,
                amount: record.amount,
            });

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

    console.log('Effective record:', effectiveRecord);
    return Number(effectiveRecord?.amount ?? 0);
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

export default function EmployeePrintReport({
    employee,
    allDeductions,
    allClaims,
    allAdjustments,
    filterMonth,
    filterYear,
    printType = 'all',
}: PrintReportPageProps) {
    // Group deductions by year-month
    const deductionsByPeriod: Record<string, MonthlyDeductionRow> = {};
    for (const d of allDeductions) {
        const key = `${d.pay_period_year}-${String(d.pay_period_month).padStart(2, '0')}`;
        if (!deductionsByPeriod[key]) {
            deductionsByPeriod[key] = { year: d.pay_period_year, month: d.pay_period_month, items: [], total: 0 };
        }
        deductionsByPeriod[key].items.push(d);
        deductionsByPeriod[key].total += Number(d.amount);
    }
    const deductionPeriods = Object.values(deductionsByPeriod).sort((a, b) => b.year - a.year || b.month - a.month);

    // Group claims by year-month for monthly view
    const claimsByPeriod: Record<string, { year: number; month: number; items: Claim[]; total: number }> = {};
    for (const c of allClaims) {
        const claimDate = new Date(c.claim_date);
        const year = claimDate.getFullYear();
        const month = claimDate.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        if (!claimsByPeriod[key]) {
            claimsByPeriod[key] = { year, month, items: [], total: 0 };
        }
        claimsByPeriod[key].items.push(c);
        claimsByPeriod[key].total += Number(c.amount);
    }
    const claimPeriods = Object.values(claimsByPeriod).sort((a, b) => b.year - a.year || b.month - a.month);

    // Group claims by year
    const claimsByYearMap: Record<number, YearlyClaimRow> = {};
    for (const c of allClaims) {
        const year = new Date(c.claim_date).getFullYear();
        if (!claimsByYearMap[year]) {
            claimsByYearMap[year] = { year, items: [], total: 0 };
        }
        claimsByYearMap[year].items.push(c);
        claimsByYearMap[year].total += Number(c.amount);
    }
    const claimYears = Object.values(claimsByYearMap).sort((a, b) => b.year - a.year);

    const totalAllDeductions = allDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalAllClaims = allClaims.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalAllAdjustments = allAdjustments.reduce((sum, a) => sum + Number(a.amount), 0);

    // Group adjustments by year-month
    const adjustmentsByPeriod: Record<string, { year: number; month: number; items: Adjustment[]; total: number }> = {};
    for (const a of allAdjustments) {
        const key = `${a.pay_period_year}-${String(a.pay_period_month).padStart(2, '0')}`;
        if (!adjustmentsByPeriod[key]) {
            adjustmentsByPeriod[key] = { year: a.pay_period_year, month: a.pay_period_month, items: [], total: 0 };
        }
        adjustmentsByPeriod[key].items.push(a);
        adjustmentsByPeriod[key].total += Number(a.amount);
    }
    const adjustmentPeriods = Object.values(adjustmentsByPeriod).sort((a, b) => b.year - a.year || b.month - a.month);

    // Helper function to sum adjustments for a specific period
    function sumAdjustmentsForPeriod(adjustments: Adjustment[], year: number, month?: number): number {
        return adjustments
            .filter((a) => {
                const matchYear = a.pay_period_year === year;
                const matchMonth = month ? a.pay_period_month === month : true;
                return matchYear && matchMonth;
            })
            .reduce((sum, a) => sum + Number(a.amount), 0);
    }

    // Helper function to sum compensation across all periods
    function sumCompensation(history: { amount: number; effective_date: string }[] | undefined): number {
        if (!history || history.length === 0) return 0;
        return history.reduce((sum, record) => sum + Number(record.amount), 0);
    }

    // Helper function to sum compensation for date range records
    function sumCompensationForDateRange(history: { amount: number; start_date: string; end_date?: string }[] | undefined): number {
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

    // Helper function to sum date range compensation for a specific year
    function sumCompensationForYearDateRange(history: { amount: number; start_date: string; end_date?: string }[] | undefined, year: number): number {
        if (!history || history.length === 0) return 0;
        return history.reduce((sum, record) => {
            const recordYear = new Date(record.start_date).getFullYear();
            return recordYear === year ? sum + Number(record.amount) : sum;
        }, 0);
    }

    // Determine which compensation values to show based on filters
    let salary: number;
    let pera: number;
    let rata: number;
    let hazardPay: number;
    let clothingAllowance: number;
    let adjustments: number;
    let showGrossAndNet: boolean = true;
    let isAllTimeView: boolean = false;
    let isYearlyView: boolean = false;

    if (filterMonth && filterYear) {
        salary = getEffectiveAmount(employee.salaries, parseInt(filterYear), parseInt(filterMonth));
        pera = getEffectiveAmount(employee.peras, parseInt(filterYear), parseInt(filterMonth));
        rata = employee.is_rata_eligible ? getEffectiveAmount(employee.ratas, parseInt(filterYear), parseInt(filterMonth)) : 0;
        hazardPay = getEffectiveAmountForDateRange(employee.hazardPays, parseInt(filterYear), parseInt(filterMonth));
        clothingAllowance = getEffectiveAmountForDateRange(employee.clothingAllowances, parseInt(filterYear), parseInt(filterMonth));
        adjustments = sumAdjustmentsForPeriod(allAdjustments, parseInt(filterYear), parseInt(filterMonth));
        showGrossAndNet = true;
    } else if (filterYear) {
        salary = sumCompensationForYear(employee.salaries, parseInt(filterYear));
        pera = sumCompensationForYear(employee.peras, parseInt(filterYear));
        rata = employee.is_rata_eligible ? sumCompensationForYear(employee.ratas, parseInt(filterYear)) : 0;
        hazardPay = sumCompensationForYearDateRange(employee.hazardPays, parseInt(filterYear));
        clothingAllowance = sumCompensationForYearDateRange(employee.clothingAllowances, parseInt(filterYear));
        adjustments = sumAdjustmentsForPeriod(allAdjustments, parseInt(filterYear));
        showGrossAndNet = true;
        isYearlyView = true;
    } else {
        salary = sumCompensation(employee.salaries);
        pera = sumCompensation(employee.peras);
        rata = employee.is_rata_eligible ? sumCompensation(employee.ratas) : 0;
        hazardPay = sumCompensationForDateRange(employee.hazardPays);
        clothingAllowance = sumCompensationForDateRange(employee.clothingAllowances);
        adjustments = totalAllAdjustments;
        showGrossAndNet = true; // Now we can show gross/net for all-time view
        isAllTimeView = true;
    }

    const grossPay = salary + pera + rata + hazardPay + clothingAllowance + adjustments;
    const netPay = grossPay - totalAllDeductions;

    const currentDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Generate filter description
    const getFilterDescription = () => {
        if (filterMonth && filterYear) {
            return `${MONTHS[parseInt(filterMonth) - 1]} ${filterYear}`;
        } else if (filterMonth) {
            return `${MONTHS[parseInt(filterMonth) - 1]} (All Years)`;
        } else if (filterYear) {
            return `Year ${filterYear}`;
        }
        return 'All Records';
    };

    // Get unique months from deductions, claims, and adjustments
    const allPeriods = new Set<string>();
    deductionPeriods.forEach((p) => allPeriods.add(`${p.year}-${String(p.month).padStart(2, '0')}`));
    claimPeriods.forEach((p) => allPeriods.add(`${p.year}-${String(p.month).padStart(2, '0')}`));
    adjustmentPeriods.forEach((p) => allPeriods.add(`${p.year}-${String(p.month).padStart(2, '0')}`));
    const sortedPeriods = Array.from(allPeriods).sort((a, b) => b.localeCompare(a));

    const handlePrint = () => {
        window.print();
    };

    const getTitle = () => {
        const baseTitle = `Print Report - ${employee.last_name}, ${employee.first_name}`;
        if (printType === 'deductions') {
            return filterMonth && filterYear
                ? `Deductions - ${MONTHS[parseInt(filterMonth) - 1]} ${filterYear} - ${baseTitle}`
                : `Deductions - ${baseTitle}`;
        }
        if (printType === 'claims') {
            return filterMonth && filterYear ? `Claims - ${MONTHS[parseInt(filterMonth) - 1]} ${filterYear} - ${baseTitle}` : `Claims - ${baseTitle}`;
        }
        return baseTitle;
    };

    return (
        <div className="mx-auto min-h-screen bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title={getTitle()} />

            <div className="mb-4 flex justify-end print:hidden">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>

            <div className="mx-auto w-[8in] print:w-full">
                <table className="w-full border-0">
                    <thead className="hidden print:table-header-group">
                        <tr>
                            <td>
                                <div className="h-[9mm]"></div>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                {/* Header */}
                                <div className="mb-5 text-center">
                                    <h2
                                        className="m-0 text-[16px] font-bold uppercase"
                                        style={{
                                            fontFamily: '"Old English Text MT", "Times New Roman", serif',
                                        }}
                                    >
                                        EMPLOYEE FINANCIAL REPORT
                                    </h2>
                                    <p className="m-[5px_0] text-[12px]">
                                        {employee.last_name}, {employee.first_name} {employee.middle_name}
                                    </p>
                                    <p className="m-0 text-[11px]">
                                        {employee.position} — {employee.office?.name || 'N/A'}
                                    </p>
                                    <p className="m-0 text-[10px] text-gray-500">
                                        Period: {getFilterDescription()} • Generated: {currentDate}
                                    </p>
                                </div>

                                {/* Summary Table */}
                                <table className="mb-6 w-full border-collapse border border-black">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">Basic Salary</td>
                                            <td className="border border-black p-2 text-right">
                                                {formatCurrency(salary)}
                                                {(isAllTimeView || isYearlyView) && ' *'}
                                            </td>
                                            <td className="border border-black p-2 font-bold">PERA</td>
                                            <td className="border border-black p-2 text-right">
                                                {formatCurrency(pera)}
                                                {(isAllTimeView || isYearlyView) && ' *'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">RATA</td>
                                            <td className="border border-black p-2 text-right">
                                                {employee.is_rata_eligible ? formatCurrency(rata) + (isAllTimeView || isYearlyView ? ' *' : '') : '-'}
                                            </td>
                                            <td className="border border-black p-2 font-bold">Hazard Pay</td>
                                            <td className="border border-black p-2 text-right">
                                                {formatCurrency(hazardPay)}
                                                {(isAllTimeView || isYearlyView) && ' *'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">Clothing Allowance</td>
                                            <td className="border border-black p-2 text-right">
                                                {formatCurrency(clothingAllowance)}
                                                {(isAllTimeView || isYearlyView) && ' *'}
                                            </td>
                                            <td className="border border-black p-2 font-bold">Adjustments</td>
                                            <td className="border border-black p-2 text-right">
                                                {formatCurrency(adjustments)}
                                                {(isAllTimeView || isYearlyView) && ' *'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">Gross Pay</td>
                                            <td className="border border-black p-2 text-right font-medium" colSpan={3}>
                                                {formatCurrency(grossPay)}
                                                {(isAllTimeView || isYearlyView) && ' *'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">Total Deductions</td>
                                            <td className="border border-black p-2 text-right text-red-600">{formatCurrency(totalAllDeductions)}</td>
                                            <td className="border border-black p-2 font-bold">Net Pay</td>
                                            <td className="border border-black p-2 text-right font-bold text-green-600">
                                                {formatCurrency(netPay)}
                                                {(isAllTimeView || isYearlyView) && ' *'}
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <td
                                                className="border border-black p-2 font-bold"
                                                colSpan={4}
                                                style={{ textAlign: 'center', fontSize: '9px' }}
                                            >
                                                {isAllTimeView && '* Sum of all recorded periods'}
                                                {isYearlyView && `* Total for year ${filterYear}`}
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <td className="border border-black p-2 font-bold" colSpan={2}>
                                                Total Claims
                                            </td>
                                            <td className="border border-black p-2 text-right font-bold text-blue-600" colSpan={2}>
                                                {formatCurrency(totalAllClaims)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Monthly Sections */}
                                <div className="space-y-8">
                                    {sortedPeriods.map((periodKey) => {
                                        const [year, month] = periodKey.split('-').map(Number);
                                        const deductionPeriod = deductionPeriods.find((p) => p.year === year && p.month === month);
                                        const claimPeriod = claimPeriods.find((p) => p.year === year && p.month === month);
                                        const adjustmentPeriod = adjustmentPeriods.find((p) => p.year === year && p.month === month);

                                        // Skip if this period doesn't match the print type
                                        if (printType === 'deductions' && !deductionPeriod) return null;
                                        if (printType === 'claims' && !claimPeriod) return null;
                                        if (!deductionPeriod && !claimPeriod && !adjustmentPeriod) return null;

                                        return (
                                            <div key={periodKey} className="break-inside-avoid">
                                                {/* Month Header */}
                                                <div className="mb-2 flex items-baseline justify-between border-b border-black pb-1">
                                                    <h3 className="m-0 text-[13px] font-bold uppercase">
                                                        {MONTHS[month - 1]} {year}
                                                    </h3>
                                                    {deductionPeriod && printType !== 'claims' && (
                                                        <div className="text-[11px]">
                                                            Deductions:{' '}
                                                            <span className="font-bold text-red-600">{formatCurrency(deductionPeriod.total)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Deductions Table */}
                                                {deductionPeriod && printType !== 'claims' && (
                                                    <table className="mb-4 w-full border-collapse border border-black">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">
                                                                    Deduction Type
                                                                </th>
                                                                <th className="w-28 border border-black px-2 py-1 text-right text-[10px] font-semibold">
                                                                    Amount
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {deductionPeriod.items.map((d) => (
                                                                <tr key={d.id}>
                                                                    <td className="border border-black px-2 py-1 text-[10px] uppercase">
                                                                        {d.deduction_type?.name ?? '—'}
                                                                    </td>
                                                                    <td className="border border-black px-2 py-1 text-right text-[10px] text-red-600">
                                                                        {formatCurrency(Number(d.amount))}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-gray-50 font-bold">
                                                                <td className="border border-black px-2 py-1 text-[10px] uppercase">TOTAL</td>
                                                                <td className="border border-black px-2 py-1 text-right text-[10px] text-red-600">
                                                                    {formatCurrency(deductionPeriod.total)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                )}

                                                {/* Claims Section */}
                                                {claimPeriod && printType !== 'deductions' && (
                                                    <>
                                                        <div className="mb-2 text-[11px]">
                                                            Claims:{' '}
                                                            <span className="font-bold text-green-600">{formatCurrency(claimPeriod.total)}</span>
                                                        </div>
                                                        <table className="w-full border-collapse border border-black">
                                                            <thead>
                                                                <tr className="bg-gray-100">
                                                                    <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">
                                                                        Claim
                                                                    </th>
                                                                    <th className="w-28 border border-black px-2 py-1 text-right text-[10px] font-semibold">
                                                                        Amount
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {claimPeriod.items.map((c) => (
                                                                    <tr key={c.id}>
                                                                        <td className="border border-black px-2 py-1">
                                                                            <div className="text-[10px] font-medium uppercase">
                                                                                {c.claim_type?.name ?? '—'}
                                                                            </div>
                                                                            <div className="text-[9px] text-gray-500">{c.purpose}</div>
                                                                        </td>
                                                                        <td className="border border-black px-2 py-1 text-right text-[10px] text-green-600">
                                                                            {formatCurrency(Number(c.amount))}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="bg-gray-50 font-bold">
                                                                    <td className="border border-black px-2 py-1 text-[10px] uppercase">TOTAL</td>
                                                                    <td className="border border-black px-2 py-1 text-right text-[10px] text-green-600">
                                                                        {formatCurrency(claimPeriod.total)}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </>
                                                )}

                                                {/* Adjustments Section */}
                                                {adjustmentPeriod && (
                                                    <>
                                                        <div className="mt-3 mb-2 text-[11px]">
                                                            Adjustments:{' '}
                                                            <span className="font-bold text-blue-600">{formatCurrency(adjustmentPeriod.total)}</span>
                                                        </div>
                                                        <table className="w-full border-collapse border border-black">
                                                            <thead>
                                                                <tr className="bg-gray-100">
                                                                    <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">
                                                                        Type
                                                                    </th>
                                                                    <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">
                                                                        Reference
                                                                    </th>
                                                                    <th className="w-24 border border-black px-2 py-1 text-right text-[10px] font-semibold">
                                                                        Amount
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {adjustmentPeriod.items.map((a) => (
                                                                    <tr key={a.id}>
                                                                        <td className="border border-black px-2 py-1 text-[10px] uppercase">
                                                                            {a.adjustment_type ?? '—'}
                                                                        </td>
                                                                        <td className="border border-black px-2 py-1 text-[10px]">
                                                                            {a.reference_type ?? '—'}
                                                                        </td>
                                                                        <td className="border border-black px-2 py-1 text-right text-[10px] text-blue-600">
                                                                            {formatCurrency(Number(a.amount))}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="bg-gray-50 font-bold">
                                                                    <td className="border border-black px-2 py-1 text-[10px] uppercase" colSpan={2}>
                                                                        TOTAL
                                                                    </td>
                                                                    <td className="border border-black px-2 py-1 text-right text-[10px] text-blue-600">
                                                                        {formatCurrency(adjustmentPeriod.total)}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Yearly Summary */}
                                {(claimYears.length > 0 || deductionPeriods.length > 0 || adjustmentPeriods.length > 0) && (
                                    <div className="mt-6 break-inside-avoid">
                                        <div className="mb-2 border-b border-black pb-1">
                                            <h3 className="m-0 text-[13px] font-bold uppercase">Yearly Summary</h3>
                                        </div>
                                        <table className="w-full border-collapse border border-black">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-black px-2 py-1 text-left">Year</th>
                                                    <th className="border border-black px-2 py-1 text-right">Total Deductions</th>
                                                    <th className="border border-black px-2 py-1 text-right">Total Claims</th>
                                                    <th className="border border-black px-2 py-1 text-right">Total Adjustments</th>
                                                    <th className="border border-black px-2 py-1 text-right">Net</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from(
                                                    new Set([
                                                        ...deductionPeriods.map((p) => p.year),
                                                        ...claimYears.map((c) => c.year),
                                                        ...adjustmentPeriods.map((p) => p.year),
                                                    ]),
                                                )
                                                    .sort((a, b) => b - a)
                                                    .map((year) => {
                                                        const yearDeductions = deductionPeriods
                                                            .filter((p) => p.year === year)
                                                            .reduce((sum, p) => sum + p.total, 0);
                                                        const yearClaims = claimYears.find((c) => c.year === year)?.total ?? 0;
                                                        const yearAdjustments = adjustmentPeriods
                                                            .filter((p) => p.year === year)
                                                            .reduce((sum, p) => sum + p.total, 0);

                                                        return (
                                                            <tr key={year}>
                                                                <td className="border border-black px-2 py-1 font-bold">{year}</td>
                                                                <td className="border border-black px-2 py-1 text-right text-red-600">
                                                                    {formatCurrency(yearDeductions)}
                                                                </td>
                                                                <td className="border border-black px-2 py-1 text-right text-green-600">
                                                                    {formatCurrency(yearClaims)}
                                                                </td>
                                                                <td className="border border-black px-2 py-1 text-right text-blue-600">
                                                                    {formatCurrency(yearAdjustments)}
                                                                </td>
                                                                <td className="border border-black px-2 py-1 text-right font-bold">
                                                                    {formatCurrency(yearClaims + yearAdjustments - yearDeductions)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                <tr className="bg-gray-100 font-bold">
                                                    <td className="border border-black px-2 py-1">GRAND TOTAL</td>
                                                    <td className="border border-black px-2 py-1 text-right text-red-600">
                                                        {formatCurrency(totalAllDeductions)}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right text-green-600">
                                                        {formatCurrency(totalAllClaims)}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right text-blue-600">
                                                        {formatCurrency(totalAllAdjustments)}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right">
                                                        {formatCurrency(totalAllClaims + totalAllAdjustments - totalAllDeductions)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Footer */}
                                <PrintFFooter />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
