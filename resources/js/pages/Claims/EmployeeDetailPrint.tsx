import PrintFFooter from '@/components/print-footer';
import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

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

interface EmployeeDetailPrintProps {
    employee: Employee;
    claims: Claim[];
    summary: Summary;
    filters: {
        month: string | null;
        year: number | null;
        type: string | null;
    };
}

export default function EmployeeClaimsDetailPrint({ employee, claims, summary, filters }: EmployeeDetailPrintProps) {
    const currentDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const getFilterDescription = () => {
        if (filters.month && filters.year) {
            return `${MONTHS[parseInt(filters.month) - 1]} ${filters.year}`;
        } else if (filters.year) {
            return `Year ${filters.year}`;
        }
        return 'All Records';
    };

    const getTypeLabel = () => {
        if (filters.type === 'travel') return 'Travel Claims Only';
        if (filters.type === 'overtime') return 'Overtime Claims Only';
        return 'All Claim Types';
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="mx-auto min-h-screen bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title={`Claims Report - ${employee.name}`} />

            <div className="mb-4 flex justify-end print:hidden">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>

            <div className="mx-auto w-[8in] print:w-full">
                {/* Header */}
                <div className="mb-5 text-center">
                    <h2 className="m-0 text-[16px] font-bold uppercase" style={{ fontFamily: '"Old English Text MT", "Times New Roman", serif' }}>
                        EMPLOYEE CLAIMS REPORT
                    </h2>
                    <p className="m-[5px_0] text-[12px]">{employee.name}</p>
                    <p className="m-0 text-[11px]">
                        {employee.position} — {employee.office}
                    </p>
                    <p className="m-0 text-[10px] text-gray-500">
                        Period: {getFilterDescription()} • Type: {getTypeLabel()} • Generated: {currentDate}
                    </p>
                </div>

                {/* Summary Table */}
                <table className="mb-6 w-full border-collapse border border-black">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 font-bold">Total Claims</td>
                            <td className="border border-black p-2 text-right">{summary.total_claims}</td>
                            <td className="border border-black p-2 font-bold">Total Amount</td>
                            <td className="border border-black p-2 text-right font-medium">{formatCurrency(summary.total_amount)}</td>
                        </tr>
                        <tr className="bg-blue-50">
                            <td className="border border-black p-2 font-bold">Travel Claims</td>
                            <td className="border border-black p-2 text-right">{summary.travel_count}</td>
                            <td className="border border-black p-2 text-right text-blue-600">{formatCurrency(summary.travel_amount)}</td>
                            <td className="border border-black p-2"></td>
                        </tr>
                        <tr className="bg-emerald-50">
                            <td className="border border-black p-2 font-bold">Overtime Claims</td>
                            <td className="border border-black p-2 text-right">{summary.overtime_count}</td>
                            <td className="border border-black p-2 text-right text-emerald-600">{formatCurrency(summary.overtime_amount)}</td>
                            <td className="border border-black p-2"></td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold">Other Claims</td>
                            <td className="border border-black p-2 text-right">{summary.other_count}</td>
                            <td className="border border-black p-2 text-right">{formatCurrency(summary.other_amount)}</td>
                            <td className="border border-black p-2"></td>
                        </tr>
                    </tbody>
                </table>

                {/* Claims Table */}
                {claims.length > 0 ? (
                    <table className="w-full border-collapse border border-black">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">#</th>
                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Date</th>
                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Type</th>
                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Purpose</th>
                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Salary Basis</th>
                                <th className="border border-black px-2 py-1 text-right text-[10px] font-semibold">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map((claim, index) => (
                                <tr key={claim.id}>
                                    <td className="border border-black px-2 py-1 text-center text-[10px]">{index + 1}</td>
                                    <td className="border border-black px-2 py-1 text-[10px]">{formatDate(claim.claim_date)}</td>
                                    <td className="border border-black px-2 py-1 text-[10px] font-medium uppercase">
                                        {claim.claim_type.name ?? '—'}
                                    </td>
                                    <td className="border border-black px-2 py-1 text-[10px]">{claim.purpose}</td>
                                    <td className="border border-black px-2 py-1 text-left text-[9px]">
                                        {claim.salary ? (
                                            <span>
                                                {formatCurrency(Number(claim.salary.amount))}
                                                <span className="ml-0.5">
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
                                    <td className="border border-black px-2 py-1 text-right text-[10px]">{formatCurrency(Number(claim.amount))}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-100 font-bold">
                                <td className="border border-black px-2 py-1 text-[10px]" colSpan={5}>
                                    TOTAL
                                </td>
                                <td className="border border-black px-2 py-1 text-right text-[10px]">{formatCurrency(summary.total_amount)}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div className="py-12 text-center text-gray-500">
                        <p>No claims data found for the selected filters</p>
                    </div>
                )}

                {/* Footer */}
                <PrintFFooter />
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0 10mm; -webkit-print-color-adjust: exact; }
                    table { border-collapse: collapse; }
                    td, th { padding: 4px 6px !important; font-size: 11px; page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
}
