import PrintFFooter from '@/components/print-footer';
import type { Claim } from '@/types/claim';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { forwardRef } from 'react';

interface PrintReportProps {
    employee: Employee;
    allDeductions: EmployeeDeduction[];
    allClaims: Claim[];
    filterMonth?: string | null;
    filterYear?: string | null;
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

    // Create a date for the end of the period (last day of the month)
    const periodEndDate = new Date(periodYear, periodMonth, 0);

    // Sort history by effective_date descending (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

    // Find the most recent record that was effective before or during this period
    for (const record of sortedHistory) {
        const effectiveDate = new Date(record.effective_date);
        if (effectiveDate <= periodEndDate) {
            return Number(record.amount);
        }
    }

    // If no record found, return the oldest one (fallback)
    return Number(sortedHistory[sortedHistory.length - 1]?.amount ?? 0);
}

// Helper function to get hazard pay for a specific period (based on start_date)
function getHazardPayForPeriod(hazardPays: { amount: number; start_date: string }[] | undefined, periodYear: number, periodMonth: number): number {
    if (!hazardPays || hazardPays.length === 0) return 0;

    // Create a date for the end of the period (last day of the month)
    const periodEndDate = new Date(periodYear, periodMonth, 0);

    // Sort by start_date descending (newest first)
    const sortedHazard = [...hazardPays].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

    // Find the most recent hazard pay that started before or during this period
    for (const hazard of sortedHazard) {
        const hazardStartDate = new Date(hazard.start_date);
        if (hazardStartDate <= periodEndDate) {
            return Number(hazard.amount);
        }
    }

    return 0;
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

export const PrintReport = forwardRef<HTMLDivElement, PrintReportProps>(({ employee, allDeductions, allClaims, filterMonth, filterYear }, ref) => {
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

    // Determine which compensation values to show based on filters
    let salary: number;
    let pera: number;
    let rata: number;
    let hazardPay: number;

    if (filterMonth && filterYear) {
        salary = getEffectiveAmount(employee.salaries, parseInt(filterYear), parseInt(filterMonth));
        pera = getEffectiveAmount(employee.peras, parseInt(filterYear), parseInt(filterMonth));
        rata = employee.is_rata_eligible ? getEffectiveAmount(employee.ratas, parseInt(filterYear), parseInt(filterMonth)) : 0;
        hazardPay = getHazardPayForPeriod(employee.hazardPays, parseInt(filterYear), parseInt(filterMonth));
    } else if (filterYear) {
        salary = getEffectiveAmount(employee.salaries, parseInt(filterYear), 12);
        pera = getEffectiveAmount(employee.peras, parseInt(filterYear), 12);
        rata = employee.is_rata_eligible ? getEffectiveAmount(employee.ratas, parseInt(filterYear), 12) : 0;
        hazardPay = getHazardPayForPeriod(employee.hazardPays, parseInt(filterYear), 12);
    } else {
        salary = Number(employee.latest_salary?.amount ?? 0);
        pera = Number(employee.latest_pera?.amount ?? 0);
        rata = employee.is_rata_eligible ? Number(employee.latest_rata?.amount ?? 0) : 0;
        hazardPay = Number(employee.latest_hazard_pay?.amount ?? 0);
    }

    const grossPay = salary + pera + rata + hazardPay;
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

    // Get unique months from both deductions and claims
    const allPeriods = new Set<string>();
    deductionPeriods.forEach((p) => allPeriods.add(`${p.year}-${String(p.month).padStart(2, '0')}`));
    claimPeriods.forEach((p) => allPeriods.add(`${p.year}-${String(p.month).padStart(2, '0')}`));
    const sortedPeriods = Array.from(allPeriods).sort((a, b) => b.localeCompare(a));

    return (
        <div ref={ref} className="mx-auto min-h-screen max-w-[216mm] bg-white p-8 font-sans text-[11px] leading-[1.3] text-black print:p-0">
            <div className="print:w-full">
                <table className="w-full">
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
                                            <td className="border border-black p-2 text-right">{formatCurrency(salary)}</td>
                                            <td className="border border-black p-2 font-bold">PERA</td>
                                            <td className="border border-black p-2 text-right">{formatCurrency(pera)}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">RATA</td>
                                            <td className="border border-black p-2 text-right">
                                                {employee.is_rata_eligible ? formatCurrency(rata) : '-'}
                                            </td>
                                            <td className="border border-black p-2 font-bold">Hazard Pay</td>
                                            <td className="border border-black p-2 text-right">{formatCurrency(hazardPay)}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">Gross Pay</td>
                                            <td className="border border-black p-2 text-right font-medium" colSpan={3}>
                                                {formatCurrency(grossPay)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">Total Deductions</td>
                                            <td className="border border-black p-2 text-right text-red-600">{formatCurrency(totalAllDeductions)}</td>
                                            <td className="border border-black p-2 font-bold">Net Pay</td>
                                            <td className="border border-black p-2 text-right font-bold text-green-600">{formatCurrency(netPay)}</td>
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
                                <div className="space-y-6">
                                    {sortedPeriods.map((periodKey) => {
                                        const [year, month] = periodKey.split('-').map(Number);
                                        const deductionPeriod = deductionPeriods.find((p) => p.year === year && p.month === month);
                                        const claimPeriod = claimPeriods.find((p) => p.year === year && p.month === month);

                                        if (!deductionPeriod && !claimPeriod) return null;

                                        return (
                                            <div key={periodKey} className="break-inside-avoid">
                                                <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-black pb-1">
                                                    <h3 className="m-0 text-[13px] font-bold uppercase">
                                                        {MONTHS[month - 1]} {year}
                                                    </h3>
                                                    <div className="text-[11px]">
                                                        {deductionPeriod && (
                                                            <span>
                                                                Deductions:{' '}
                                                                <span className="font-bold text-red-600">
                                                                    {formatCurrency(deductionPeriod.total)}
                                                                </span>
                                                                {' • '}
                                                            </span>
                                                        )}
                                                        {claimPeriod && (
                                                            <span>
                                                                Claims:{' '}
                                                                <span className="font-bold text-green-600">{formatCurrency(claimPeriod.total)}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Two column layout for deductions and claims */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Deductions Table */}
                                                    <table className="w-full border-collapse border border-black">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="border border-black px-2 py-1 text-left text-[10px]">
                                                                    Deduction Type
                                                                </th>
                                                                <th className="w-24 border border-black px-2 py-1 text-right text-[10px]">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {deductionPeriod ? (
                                                                <>
                                                                    {deductionPeriod.items.map((d) => (
                                                                        <tr key={d.id}>
                                                                            <td className="border border-black px-2 py-1 uppercase">
                                                                                {d.deduction_type?.name ?? '—'}
                                                                            </td>
                                                                            <td className="border border-black px-2 py-1 text-right text-red-600">
                                                                                {formatCurrency(Number(d.amount))}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    <tr className="bg-gray-50 font-bold">
                                                                        <td className="border border-black px-2 py-1">TOTAL</td>
                                                                        <td className="border border-black px-2 py-1 text-right text-red-600">
                                                                            {formatCurrency(deductionPeriod.total)}
                                                                        </td>
                                                                    </tr>
                                                                </>
                                                            ) : (
                                                                <tr>
                                                                    <td
                                                                        colSpan={2}
                                                                        className="border border-black px-2 py-2 text-center text-gray-500 italic"
                                                                    >
                                                                        No deductions
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>

                                                    {/* Claims Table */}
                                                    <table className="w-full border-collapse border border-black">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="border border-black px-2 py-1 text-left text-[10px]">Claim</th>
                                                                <th className="w-20 border border-black px-2 py-1 text-right text-[10px]">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {claimPeriod ? (
                                                                <>
                                                                    {claimPeriod.items.map((c) => (
                                                                        <tr key={c.id}>
                                                                            <td className="border border-black px-2 py-1">
                                                                                <div className="text-[10px] font-medium uppercase">
                                                                                    {c.claim_type?.name ?? '—'}
                                                                                </div>
                                                                                <div className="text-[9px] text-gray-500">{c.purpose}</div>
                                                                            </td>
                                                                            <td className="border border-black px-2 py-1 text-right text-green-600">
                                                                                {formatCurrency(Number(c.amount))}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    <tr className="bg-gray-50 font-bold">
                                                                        <td className="border border-black px-2 py-1">TOTAL</td>
                                                                        <td className="border border-black px-2 py-1 text-right text-green-600">
                                                                            {formatCurrency(claimPeriod.total)}
                                                                        </td>
                                                                    </tr>
                                                                </>
                                                            ) : (
                                                                <tr>
                                                                    <td
                                                                        colSpan={2}
                                                                        className="border border-black px-2 py-2 text-center text-gray-500 italic"
                                                                    >
                                                                        No claims
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Yearly Summary */}
                                {(claimYears.length > 0 || deductionPeriods.length > 0) && (
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
                                                    <th className="border border-black px-2 py-1 text-right">Net</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from(new Set([...deductionPeriods.map((p) => p.year), ...claimYears.map((c) => c.year)]))
                                                    .sort((a, b) => b - a)
                                                    .map((year) => {
                                                        const yearDeductions = deductionPeriods
                                                            .filter((p) => p.year === year)
                                                            .reduce((sum, p) => sum + p.total, 0);
                                                        const yearClaims = claimYears.find((c) => c.year === year)?.total ?? 0;

                                                        return (
                                                            <tr key={year}>
                                                                <td className="border border-black px-2 py-1 font-bold">{year}</td>
                                                                <td className="border border-black px-2 py-1 text-right text-red-600">
                                                                    {formatCurrency(yearDeductions)}
                                                                </td>
                                                                <td className="border border-black px-2 py-1 text-right text-green-600">
                                                                    {formatCurrency(yearClaims)}
                                                                </td>
                                                                <td className="border border-black px-2 py-1 text-right font-bold">
                                                                    {formatCurrency(yearClaims - yearDeductions)}
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
                                                    <td className="border border-black px-2 py-1 text-right">
                                                        {formatCurrency(totalAllClaims - totalAllDeductions)}
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

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0 10mm; -webkit-print-color-adjust: exact; }
                    table {
                        border-collapse: collapse;
                    }

                    td, th {
                        padding: 4px 6px !important;
                        font-size: 11px;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
});

PrintReport.displayName = 'PrintReport';
