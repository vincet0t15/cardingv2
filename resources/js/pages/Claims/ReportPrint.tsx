import PrintFooter from '@/components/print-footer';
import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

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

interface ReportPrintProps {
    employees: EmployeeClaims[];
    summary: Summary;
    filters: {
        month: string | null;
        year: number | null;
        type: string | null;
        office: string | null;
    };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ClaimsReportPrint({ employees, summary, filters }: ReportPrintProps) {
    const currentDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const getPeriodLabel = () => {
        if (filters.month && filters.year) {
            return `${MONTHS[parseInt(filters.month) - 1]} ${filters.year}`;
        } else if (filters.year) {
            return `Year ${filters.year}`;
        }
        return 'All Time';
    };

    const getTypeLabel = () => {
        if (filters.type === 'travel') return 'Travel Claims Only';
        if (filters.type === 'overtime') return 'Overtime Claims Only';
        return 'All Claim Types';
    };

    const getOfficeLabel = () => {
        // Since we don't have the offices list in print, we'll just show if filtered
        if (filters.office) return `Office #${filters.office}`;
        return 'All Offices';
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="mx-auto min-h-screen bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title="Claims Report - Print" />

            <div className="mb-4 flex justify-end print:hidden">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>

            <div className="mx-auto w-[12in] print:w-full">
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
                                        CLAIMS REPORT
                                    </h2>
                                    <p className="m-[5px_0] text-[12px]">{getTypeLabel()}</p>
                                    <p className="m-0 text-[11px]">
                                        Period: {getPeriodLabel()} • {getOfficeLabel()}
                                    </p>
                                    <p className="m-0 text-[10px] text-gray-500">Generated: {currentDate}</p>
                                </div>

                                {/* Summary Table */}
                                <table className="mb-6 w-full border-collapse border border-black">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">Total Employees</td>
                                            <td className="border border-black p-2 text-right">{summary.total_employees}</td>
                                            <td className="border border-black p-2 font-bold">Total Claims</td>
                                            <td className="border border-black p-2 text-right font-medium">{summary.total_claims}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">Travel Claims</td>
                                            <td className="border border-black p-2 text-right">
                                                {summary.total_travel_claims} • {formatCurrency(summary.total_travel_amount)}
                                            </td>
                                            <td className="border border-black p-2 font-bold">Overtime Claims</td>
                                            <td className="border border-black p-2 text-right">
                                                {summary.total_overtime_claims} • {formatCurrency(summary.total_overtime_amount)}
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <td className="border border-black p-2 font-bold" colSpan={2}>
                                                Total Amount
                                            </td>
                                            <td className="border border-black p-2 text-right font-bold text-green-600" colSpan={2}>
                                                {formatCurrency(summary.total_amount)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Employee Claims Table */}
                                {employees.length > 0 ? (
                                    <table className="w-full border-collapse border border-black">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="w-10 border border-black px-2 py-1 text-left text-[10px] font-semibold">#</th>
                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Employee</th>
                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Office</th>
                                                <th className="w-20 border border-black px-2 py-1 text-right text-[10px] font-semibold">Claims</th>
                                                <th className="w-32 border border-black px-2 py-1 text-right text-[10px] font-semibold">
                                                    Total Amount
                                                </th>
                                                <th className="w-28 border border-black px-2 py-1 text-right text-[10px] font-semibold">Travel</th>
                                                <th className="w-28 border border-black px-2 py-1 text-right text-[10px] font-semibold">Overtime</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.map((employee, index) => (
                                                <tr key={employee.id}>
                                                    <td className="border border-black px-2 py-1 text-center text-[10px]">{index + 1}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px] font-medium uppercase">
                                                        {employee.name}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-[10px] uppercase">{employee.office}</td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px]">{employee.claim_count}</td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px] font-medium">
                                                        {formatCurrency(employee.total_amount)}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px] text-blue-600">
                                                        {employee.travel_count} • {formatCurrency(employee.travel_amount)}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px] text-green-600">
                                                        {employee.overtime_count} • {formatCurrency(employee.overtime_amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 font-bold">
                                                <td className="border border-black px-2 py-1 text-[10px] uppercase" colSpan={3}>
                                                    GRAND TOTAL
                                                </td>
                                                <td className="border border-black px-2 py-1 text-right text-[10px]">{summary.total_claims}</td>
                                                <td className="border border-black px-2 py-1 text-right text-[10px] text-green-600">
                                                    {formatCurrency(summary.total_amount)}
                                                </td>
                                                <td className="border border-black px-2 py-1 text-right text-[10px] text-blue-600">
                                                    {summary.total_travel_claims} • {formatCurrency(summary.total_travel_amount)}
                                                </td>
                                                <td className="border border-black px-2 py-1 text-right text-[10px] text-green-600">
                                                    {summary.total_overtime_claims} • {formatCurrency(summary.total_overtime_amount)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-12 text-center text-[11px]">No claims data found for the selected filters</div>
                                )}

                                {/* Footer */}
                                <PrintFooter />
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
