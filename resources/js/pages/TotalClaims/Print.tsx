import PrintFooter from '@/components/print-footer';
import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface ClaimTypeSummary {
    id: number;
    name: string;
    code: string;
    total_amount: number;
    claim_count: number;
}

interface Summary {
    total_claim_types: number;
    total_claims: number;
    total_amount: number;
}

interface TotalClaimsPrintProps {
    claimTypes: ClaimTypeSummary[];
    summary: Summary;
    filters: {
        month: string | null;
        year: number | null;
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

export default function TotalClaimsPrint({ claimTypes, summary, filters }: TotalClaimsPrintProps) {
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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="mx-auto min-h-screen bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title="Total Claims Report - Print" />

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
                                <div className="mb-5 text-center">
                                    <h2
                                        className="m-0 text-[16px] font-bold uppercase"
                                        style={{
                                            fontFamily: '"Old English Text MT", "Times New Roman", serif',
                                        }}
                                    >
                                        TOTAL CLAIMS REPORT
                                    </h2>
                                    <p className="m-0 text-[11px]">
                                        Period: {getPeriodLabel()}
                                    </p>
                                    <p className="m-0 text-[10px] text-gray-500">Generated: {currentDate}</p>
                                </div>

                                <table className="mb-6 w-full border-collapse border border-black">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-2 font-bold">Total Claim Types</td>
                                            <td className="border border-black p-2 text-right">{summary.total_claim_types}</td>
                                            <td className="border border-black p-2 font-bold">Total Claims</td>
                                            <td className="border border-black p-2 text-right font-medium">{summary.total_claims}</td>
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

                                {claimTypes.length > 0 ? (
                                    <table className="w-full border-collapse border border-black">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="w-10 border border-black px-2 py-1 text-left text-[10px] font-semibold">#</th>
                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Claim Type</th>
                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Code</th>
                                                <th className="w-28 border border-black px-2 py-1 text-right text-[10px] font-semibold">Claims</th>
                                                <th className="w-32 border border-black px-2 py-1 text-right text-[10px] font-semibold">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {claimTypes.map((type, index) => (
                                                <tr key={type.id}>
                                                    <td className="border border-black px-2 py-1 text-center text-[10px]">{index + 1}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px] font-medium uppercase">
                                                        {type.name}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-[10px] uppercase">{type.code}</td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px]">{type.claim_count}</td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px] font-medium">
                                                        {formatCurrency(type.total_amount)}
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
                                            </tr>
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-12 text-center text-[11px]">No claims data found for the selected filters</div>
                                )}

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