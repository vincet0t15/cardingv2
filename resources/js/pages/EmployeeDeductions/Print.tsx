import PrintFFooter from '@/components/print-footer';
import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

type DeductionType = {
    id: number;
    name: string;
    code: string;
};

type Employee = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    position: string | null;
    office: { name: string } | null;
    employment_status: { name: string } | null;
    salaries: Array<{ amount: number; effective_date: string }>;
    peras: Array<{ amount: number; effective_date: string }>;
    ratas: Array<{ amount: number; effective_date: string }>;
    deductions: Array<{
        id: number;
        amount: number;
        deduction_type: DeductionType | null;
    }>;
};

type PrintProps = {
    employees: Employee[];
    deductionTypes: DeductionType[];
    filters: {
        month: number;
        year: number;
        office_id: number | null;
        employment_status_id: number | null;
    };
    officeName?: string | null;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
}

function getEffectiveAmount(history: { amount: number; effective_date: string }[] | undefined, year: number, month: number): number {
    if (!history || history.length === 0) return 0;

    const periodEndDate = new Date(year, month, 0);
    const sortedHistory = [...history].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

    for (const record of sortedHistory) {
        const effectiveDate = new Date(record.effective_date);
        if (effectiveDate <= periodEndDate) {
            return Number(record.amount);
        }
    }

    return Number(sortedHistory[sortedHistory.length - 1]?.amount ?? 0);
}

export default function PrintDeductions({ employees, filters, officeName }: PrintProps) {
    const handlePrint = () => {
        window.print();
    };

    const getFilterDescription = () => {
        return `${MONTHS[filters.month - 1]} ${filters.year}${officeName ? ` • ${officeName}` : ''}`;
    };

    const currentDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Calculate grand totals
    const grandTotals = employees.reduce(
        (acc, employee) => {
            const salary = getEffectiveAmount(employee.salaries, filters.year, filters.month);
            const pera = getEffectiveAmount(employee.peras, filters.year, filters.month);
            const rata = getEffectiveAmount(employee.ratas, filters.year, filters.month);
            const grossPay = salary + pera + rata;
            const totalDeductions = employee.deductions.reduce((sum, d) => sum + Number(d.amount), 0);
            const netPay = grossPay - totalDeductions;

            return {
                gross_pay: acc.gross_pay + grossPay,
                deductions: acc.deductions + totalDeductions,
                net_pay: acc.net_pay + netPay,
            };
        },
        { gross_pay: 0, deductions: 0, net_pay: 0 },
    );

    return (
        <div className="mx-auto min-h-screen bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title="Employee Deductions Report" />

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
                                {/* Main Header */}
                                <div className="mb-5 text-center">
                                    <h2
                                        className="m-0 text-[16px] font-bold uppercase"
                                        style={{
                                            fontFamily: '"Old English Text MT", "Times New Roman", serif',
                                        }}
                                    >
                                        Employee Deductions Report
                                    </h2>
                                    <p className="m-[5px_0] text-[12px]">{getFilterDescription()}</p>
                                    <p className="m-0 text-[10px] text-gray-500">
                                        Generated: {currentDate} • Total Employees: {employees.length}
                                    </p>
                                </div>

                                {/* Individual Employee Sections */}
                                <div className="space-y-8">
                                    {employees.map((employee, index) => {
                                        const salary = getEffectiveAmount(employee.salaries, filters.year, filters.month);
                                        const pera = getEffectiveAmount(employee.peras, filters.year, filters.month);
                                        const rata = getEffectiveAmount(employee.ratas, filters.year, filters.month);
                                        const grossPay = salary + pera + rata;
                                        const totalDeductions = employee.deductions.reduce((sum, d) => sum + Number(d.amount), 0);
                                        const netPay = grossPay - totalDeductions;

                                        return (
                                            <div key={employee.id} className="break-inside-avoid">
                                                {/* Employee Header */}
                                                <div className="mb-3 border-b-2 border-black pb-2">
                                                    <div className="flex items-baseline justify-between">
                                                        <h3 className="m-0 text-[13px] font-bold uppercase">
                                                            {index + 1}. {employee.last_name}, {employee.first_name} {employee.middle_name}
                                                        </h3>
                                                    </div>
                                                    <p className="m-0 text-[10px] text-gray-600">
                                                        {employee.position} — {employee.office?.name || 'N/A'}
                                                    </p>
                                                </div>

                                                {/* Compensation Summary */}
                                                <table className="mb-3 w-full border-collapse border border-black">
                                                    <tbody>
                                                        <tr>
                                                            <td className="border border-black p-2 text-[10px] font-bold">Basic Salary</td>
                                                            <td className="border border-black p-2 text-right text-[10px]">
                                                                {formatCurrency(salary)}
                                                            </td>
                                                            <td className="border border-black p-2 text-[10px] font-bold">PERA</td>
                                                            <td className="border border-black p-2 text-right text-[10px]">{formatCurrency(pera)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-black p-2 text-[10px] font-bold">RATA</td>
                                                            <td className="border border-black p-2 text-right text-[10px]">{formatCurrency(rata)}</td>
                                                            <td className="border border-black p-2 text-[10px] font-bold">Gross Pay</td>
                                                            <td className="border border-black p-2 text-right text-[10px] font-medium">
                                                                {formatCurrency(grossPay)}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-black p-2 text-[10px] font-bold">Total Deductions</td>
                                                            <td className="border border-black p-2 text-right text-[10px] text-red-600">
                                                                {formatCurrency(totalDeductions)}
                                                            </td>
                                                            <td className="border border-black p-2 text-[10px] font-bold">Net Pay</td>
                                                            <td className="border border-black p-2 text-right text-[10px] font-bold text-green-600">
                                                                {formatCurrency(netPay)}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>

                                                {/* Deductions Table */}
                                                {employee.deductions.length > 0 ? (
                                                    <table className="w-full border-collapse border border-black">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">
                                                                    Deduction Type
                                                                </th>
                                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">
                                                                    Code
                                                                </th>
                                                                <th className="w-28 border border-black px-2 py-1 text-right text-[10px] font-semibold">
                                                                    Amount
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {employee.deductions.map((deduction) => (
                                                                <tr key={deduction.id}>
                                                                    <td className="border border-black px-2 py-1 text-[10px] uppercase">
                                                                        {deduction.deduction_type?.name ?? '—'}
                                                                    </td>
                                                                    <td className="border border-black px-2 py-1 text-[10px]">
                                                                        {deduction.deduction_type?.code ?? '—'}
                                                                    </td>
                                                                    <td className="border border-black px-2 py-1 text-right text-[10px] text-red-600">
                                                                        {formatCurrency(Number(deduction.amount))}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-gray-50 font-bold">
                                                                <td className="border border-black px-2 py-1 text-[10px] uppercase" colSpan={2}>
                                                                    TOTAL
                                                                </td>
                                                                <td className="border border-black px-2 py-1 text-right text-[10px] text-red-600">
                                                                    {formatCurrency(totalDeductions)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="mb-3 rounded border border-black p-3 text-center text-[10px] text-gray-500">
                                                        No deductions for this period
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Grand Totals */}
                                <div className="mt-6 break-inside-avoid">
                                    <div className="mb-2 border-b-2 border-black pb-2">
                                        <h3 className="m-0 text-[13px] font-bold uppercase">Grand Totals</h3>
                                    </div>
                                    <table className="w-full border-collapse border border-black">
                                        <tbody>
                                            <tr className="bg-gray-100 font-bold">
                                                <td className="border border-black p-2 text-[10px]" colSpan={2}>
                                                    Total Gross Pay
                                                </td>
                                                <td className="border border-black p-2 text-right text-[10px]">
                                                    {formatCurrency(grandTotals.gross_pay)}
                                                </td>
                                            </tr>
                                            <tr className="bg-gray-100 font-bold">
                                                <td className="border border-black p-2 text-[10px]" colSpan={2}>
                                                    Total Deductions
                                                </td>
                                                <td className="border border-black p-2 text-right text-[10px] text-red-600">
                                                    {formatCurrency(grandTotals.deductions)}
                                                </td>
                                            </tr>
                                            <tr className="bg-gray-100 font-bold">
                                                <td className="border border-black p-2 text-[10px]" colSpan={2}>
                                                    Total Net Pay
                                                </td>
                                                <td className="border border-black p-2 text-right text-[10px] text-green-600">
                                                    {formatCurrency(grandTotals.net_pay)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

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
}
