import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

type EmployeeData = {
    id: number;
    name: string;
    position: string;
    office: string;
    salary: number;
    pera: number;
    rata: number;
    gross_pay: number;
    deductions: number;
    net_pay: number;
};

type MonthlyData = {
    month: number;
    year: number;
    employees: EmployeeData[];
    totals: {
        salary: number;
        pera: number;
        rata: number;
        gross_pay: number;
        deductions: number;
        net_pay: number;
    };
};

type Props = {
    year: number;
    monthlyData: MonthlyData[];
    office?: string;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PrintPayrollReport({ year, monthlyData, office }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const getMonthName = (month: number) => {
        return MONTHS[month - 1] || '';
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate grand totals
    const grandTotals = monthlyData.reduce(
        (acc, month) => ({
            salary: acc.salary + month.totals.salary,
            pera: acc.pera + month.totals.pera,
            rata: acc.rata + month.totals.rata,
            gross_pay: acc.gross_pay + month.totals.gross_pay,
            deductions: acc.deductions + month.totals.deductions,
            net_pay: acc.net_pay + month.totals.net_pay,
        }),
        { salary: 0, pera: 0, rata: 0, gross_pay: 0, deductions: 0, net_pay: 0 },
    );

    return (
        <div className="mx-auto bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title="Payroll Report" />
            <div className="mb-4 flex justify-end print:hidden">
                <Button onClick={handlePrint}>
                    <Printer />
                    Print Report
                </Button>
            </div>

            <div className="print-wrapper mx-auto w-[12in]">
                <table className="w-full border-0">
                    <tbody>
                        <tr>
                            <td>
                                {/* Header */}
                                <div className="mb-3 text-center">
                                    <h2
                                        className="m-0 text-[14px] font-bold uppercase"
                                        style={{
                                            fontFamily: '"Old English Text MT", "Times New Roman", serif',
                                        }}
                                    >
                                        PAYROLL REPORT
                                    </h2>
                                    <p className="m-[2px_0] text-[11px]">
                                        Fiscal Year {year}
                                        {office ? ` - ${office}` : ''}
                                    </p>
                                    <p className="m-0 text-[9px] text-gray-500">
                                        Generated:{' '}
                                        {new Date().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                {/* Summary Table */}
                                <table className="mb-4 w-full border-collapse border border-black text-[10px]">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-1 font-bold">Total Gross Pay</td>
                                            <td className="border border-black p-1 text-right">{formatCurrency(grandTotals.gross_pay)}</td>
                                            <td className="border border-black p-1 font-bold">Total Deductions</td>
                                            <td className="border border-black p-1 text-right text-red-600">
                                                {formatCurrency(grandTotals.deductions)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-1 font-bold">Total Net Pay</td>
                                            <td className="border border-black p-1 text-right font-bold text-green-600">
                                                {formatCurrency(grandTotals.net_pay)}
                                            </td>
                                            <td className="border border-black p-1 font-bold">Months Processed</td>
                                            <td className="border border-black p-1 text-right">
                                                {monthlyData.filter((m) => m.employees.length > 0).length}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Monthly Sections */}
                                <div className="space-y-4">
                                    {monthlyData.map((monthData) => (
                                        <div key={`${monthData.year}-${monthData.month}`} className="avoid-break">
                                            <div className="mb-1 flex items-baseline justify-between gap-3 border-b border-black pb-1">
                                                <h3 className="m-0 text-[12px] font-bold uppercase">
                                                    {getMonthName(monthData.month)} {monthData.year}
                                                </h3>
                                                <div className="text-[10px]">
                                                    Employees: {monthData.employees.length} • Net Pay:{' '}
                                                    <span className="font-bold text-green-600">{formatCurrency(monthData.totals.net_pay)}</span>
                                                </div>
                                            </div>

                                            <table className="w-full border-collapse border border-black text-[10px]">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="w-8 border border-black px-1 py-0.5 text-left">#</th>
                                                        <th className="border border-black px-1 py-0.5 text-left">Employee</th>
                                                        <th className="border border-black px-1 py-0.5 text-left">Position</th>
                                                        <th className="w-20 border border-black px-1 py-0.5 text-right">Salary</th>
                                                        <th className="w-16 border border-black px-1 py-0.5 text-right">PERA</th>
                                                        <th className="w-16 border border-black px-1 py-0.5 text-right">RATA</th>
                                                        <th className="w-20 border border-black px-1 py-0.5 text-right">Gross</th>
                                                        <th className="w-20 border border-black px-1 py-0.5 text-right">Deductions</th>
                                                        <th className="w-20 border border-black px-1 py-0.5 text-right">Net Pay</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {monthData.employees.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={9} className="border border-black px-1 py-1 text-center italic">
                                                                No employees for this period.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        <>
                                                            {monthData.employees.map((employee, idx) => (
                                                                <tr key={employee.id}>
                                                                    <td className="border border-black px-1 py-0.5">{idx + 1}</td>
                                                                    <td className="border border-black px-1 py-0.5 uppercase">{employee.name}</td>
                                                                    <td className="border border-black px-1 py-0.5">{employee.position}</td>
                                                                    <td className="border border-black px-1 py-0.5 text-right">
                                                                        {formatCurrency(employee.salary)}
                                                                    </td>
                                                                    <td className="border border-black px-1 py-0.5 text-right">
                                                                        {formatCurrency(employee.pera)}
                                                                    </td>
                                                                    <td className="border border-black px-1 py-0.5 text-right">
                                                                        {employee.rata > 0 ? formatCurrency(employee.rata) : '-'}
                                                                    </td>
                                                                    <td className="border border-black px-1 py-0.5 text-right font-medium">
                                                                        {formatCurrency(employee.gross_pay)}
                                                                    </td>
                                                                    <td className="border border-black px-1 py-0.5 text-right text-red-600">
                                                                        {formatCurrency(employee.deductions)}
                                                                    </td>
                                                                    <td className="border border-black px-1 py-0.5 text-right font-bold text-green-600">
                                                                        {formatCurrency(employee.net_pay)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {/* Monthly Totals Row */}
                                                            <tr className="bg-gray-100 font-bold">
                                                                <td colSpan={3} className="border border-black px-1 py-0.5">
                                                                    MONTHLY TOTAL
                                                                </td>
                                                                <td className="border border-black px-1 py-0.5 text-right">
                                                                    {formatCurrency(monthData.totals.salary)}
                                                                </td>
                                                                <td className="border border-black px-1 py-0.5 text-right">
                                                                    {formatCurrency(monthData.totals.pera)}
                                                                </td>
                                                                <td className="border border-black px-1 py-0.5 text-right">
                                                                    {formatCurrency(monthData.totals.rata)}
                                                                </td>
                                                                <td className="border border-black px-1 py-0.5 text-right">
                                                                    {formatCurrency(monthData.totals.gross_pay)}
                                                                </td>
                                                                <td className="border border-black px-1 py-0.5 text-right text-red-600">
                                                                    {formatCurrency(monthData.totals.deductions)}
                                                                </td>
                                                                <td className="border border-black px-1 py-0.5 text-right text-green-600">
                                                                    {formatCurrency(monthData.totals.net_pay)}
                                                                </td>
                                                            </tr>
                                                        </>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>

                                {/* Grand Total */}
                                <div className="mt-4 print:mt-2">
                                    <table className="w-full border-collapse border-2 border-black text-[10px]">
                                        <tbody>
                                            <tr className="bg-gray-200 font-bold">
                                                <td className="border border-black p-1">GRAND TOTAL FOR {year}</td>
                                                <td className="border border-black p-1 text-right">Salary: {formatCurrency(grandTotals.salary)}</td>
                                                <td className="border border-black p-1 text-right">PERA: {formatCurrency(grandTotals.pera)}</td>
                                                <td className="border border-black p-1 text-right">RATA: {formatCurrency(grandTotals.rata)}</td>
                                                <td className="border border-black p-1 text-right">Gross: {formatCurrency(grandTotals.gross_pay)}</td>
                                                <td className="border border-black p-1 text-right text-red-600">
                                                    Deductions: {formatCurrency(grandTotals.deductions)}
                                                </td>
                                                <td className="border border-black p-1 text-right text-green-600">
                                                    Net: {formatCurrency(grandTotals.net_pay)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
