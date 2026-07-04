import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface OfficeFund {
    source_of_fund_code_id: number;
    code: string;
    code_description: string | null;
    general_fund_name: string | null;
    general_fund_code: string | null;
    total_amount: number;
    employee_count: number;
}

interface OfficeData {
    id: number;
    name: string;
    funds: OfficeFund[];
    total_amount: number;
}

interface Props {
    offices: OfficeData[];
    filters: {
        month: number;
        year: number;
        monthName: string;
        office_id: number | null;
        officeName: string | null;
    };
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function SalariesByOfficeFundPrint({ offices, filters }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const grandTotal = offices.reduce((sum, office) => sum + office.total_amount, 0);
    const totalEmployees = offices.reduce(
        (sum, office) => sum + office.funds.reduce((s, f) => s + f.employee_count, 0),
        0,
    );

    const currentDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="mx-auto bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title="Salaries by Office & Source of Fund" />

            <div className="mb-4 flex justify-end print:hidden">
                <Button onClick={handlePrint}>
                    <Printer className="mr-1 h-4 w-4" />
                    Print
                </Button>
            </div>

            <div className="mb-6 text-center">
                <h1
                    className="m-0 text-[18px] font-bold uppercase"
                    style={{
                        fontFamily: '"Old English Text MT", "Times New Roman", serif',
                    }}
                >
                    Salaries by Office & Source of Fund
                </h1>
                <p className="m-[5px_0] text-[12px]">
                    {filters.monthName} {filters.year}
                    {filters.officeName && <span> — {filters.officeName}</span>}
                </p>
                <p className="m-0 text-[10px] text-gray-500">Generated: {currentDate}</p>
            </div>

            {offices.length > 0 ? (
                offices.map((office) => {
                    const officeTotalEmployees = office.funds.reduce((sum, f) => sum + f.employee_count, 0);
                    return (
                        <div key={office.id} className="mb-6">
                            <h2 className="mb-2 bg-gray-200 p-2 text-[13px] font-bold">
                                {office.name} — {formatCurrency(office.total_amount)} ({officeTotalEmployees} employee
                                {officeTotalEmployees !== 1 ? 's' : ''})
                            </h2>
                            <table className="w-full border-collapse border border-black">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold" style={{ width: '40px' }}>
                                            #
                                        </th>
                                        <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Fund Code</th>
                                        <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">General Fund</th>
                                        <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Description</th>
                                        <th className="border border-black px-2 py-1 text-right text-[10px] font-semibold">Amount</th>
                                        <th className="border border-black px-2 py-1 text-center text-[10px] font-semibold">Employees</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {office.funds.map((fund, index) => (
                                        <tr key={fund.source_of_fund_code_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-black px-2 py-1 text-center text-[10px]">{index + 1}</td>
                                            <td className="border border-black px-2 py-1 text-[10px] font-medium">{fund.code}</td>
                                            <td className="border border-black px-2 py-1 text-[10px]">{fund.general_fund_name || '—'}</td>
                                            <td className="border border-black px-2 py-1 text-[10px]">{fund.code_description || '—'}</td>
                                            <td className="border border-black px-2 py-1 text-right text-[10px]">
                                                {formatCurrency(fund.total_amount)}
                                            </td>
                                            <td className="border border-black px-2 py-1 text-center text-[10px]">{fund.employee_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-200 font-bold">
                                        <td colSpan={4} className="border border-black px-2 py-1 text-right text-[10px]">
                                            Office Total:
                                        </td>
                                        <td className="border border-black px-2 py-1 text-right text-[10px]">
                                            {formatCurrency(office.total_amount)}
                                        </td>
                                        <td className="border border-black px-2 py-1 text-center text-[10px]">{officeTotalEmployees}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    );
                })
            ) : (
                <div className="py-8 text-center text-gray-500">
                    <p>No salary data found for {filters.monthName} {filters.year}.</p>
                </div>
            )}

            {offices.length > 0 && (
                <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between text-sm">
                        <div>
                            <p>
                                <strong>Total Offices:</strong> {offices.length}
                            </p>
                            <p>
                                <strong>Total Employees:</strong> {totalEmployees}
                            </p>
                            <p>
                                <strong>Grand Total:</strong> {formatCurrency(grandTotal)}
                            </p>
                        </div>
                        <div className="text-right text-[9px] text-gray-500">
                            <p>This is a computer-generated report and does not require a signature.</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    @page { margin: 10mm; size: landscape; }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    table {
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
