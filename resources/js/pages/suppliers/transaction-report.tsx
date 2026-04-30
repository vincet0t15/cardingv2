import PrintFFooter from '@/components/print-footer';
import { Button } from '@/components/ui/button';
import { Supplier, SupplierTransaction } from '@/types/supplier';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

interface Props {
    supplier: Supplier;
    transactions: SupplierTransaction[];
    search?: string | null;
    year?: string | null;
    month?: string | null;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatDate = (d: string | null) => (d ? format(new Date(d), 'MMM dd, yyyy') : '—');
const formatCurrency = (v: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);

export default function SupplierTransactionReport({ supplier, transactions, search, year, month }: Props) {
    const totals = transactions.reduce(
        (acc, txn) => ({
            gross: acc.gross + Number(txn.gross),
            ewt: acc.ewt + Number(txn.ewt),
            vat: acc.vat + Number(txn.vat),
            net: acc.net + Number(txn.net_amount),
        }),
        { gross: 0, ewt: 0, vat: 0, net: 0 },
    );

    const periodLabel = year && month ? `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}` : year ? `Year ${year}` : 'All Months';

    const currentDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="mx-auto bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title={`${supplier.name} — Transaction Report`} />

            <div className="mb-4 flex justify-end print:hidden">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>

            <div className="mx-auto w-[8in] print:w-full">
                <table className="w-full border-0">
                    <thead className="hidden print:table-header-group">
                        <tr>
                            <td>
                                <div className="h-[9mm]" />
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
                                        SUPPLIER TRANSACTION REPORT
                                    </h2>
                                    <p className="m-[2px_0] text-[11px] font-semibold">{supplier.name}</p>
                                    {supplier.address && <p className="m-0 text-[10px]">{supplier.address}</p>}
                                    {supplier.contact_number && <p className="m-0 text-[10px]">{supplier.contact_number}</p>}
                                    {supplier.email && <p className="m-0 text-[10px]">{supplier.email}</p>}
                                    <p className="m-0 text-[9px] text-gray-500">
                                        Period: {periodLabel} • Generated: {currentDate}
                                    </p>
                                </div>

                                <table className="mb-4 w-full border-collapse border border-black text-[10px]">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black px-2 py-1 font-bold">Total Transactions</td>
                                            <td className="border border-black px-2 py-1 text-right">{transactions.length}</td>
                                            <td className="border border-black px-2 py-1 font-bold">Total Net</td>
                                            <td className="border border-black px-2 py-1 text-right">{formatCurrency(totals.net)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <table className="w-full border-collapse border border-black text-[10px]">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">PR Date</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">PR No.</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Particulars</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Qty / Period</th>
                                            <th className="border border-black px-2 py-1 text-right text-[10px] font-semibold">Gross</th>
                                            <th className="border border-black px-2 py-1 text-right text-[10px] font-semibold">EWT</th>
                                            <th className="border border-black px-2 py-1 text-right text-[10px] font-semibold">VAT</th>
                                            <th className="border border-black px-2 py-1 text-right text-[10px] font-semibold">Net</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Earmark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.length > 0 ? (
                                            transactions.map((txn, index) => (
                                                <tr key={txn.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="border border-black px-2 py-1 text-[10px]">{formatDate(txn.pr_date)}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px]">{txn.pr_no}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px]">{txn.particulars || '—'}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px]">{txn.qty_period_covered || '—'}</td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                        {formatCurrency(txn.gross)}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                        {formatCurrency(txn.ewt)}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                        {formatCurrency(txn.vat)}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                        {formatCurrency(txn.net_amount)}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-[10px]">{txn.earmark || '—'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="border border-black px-2 py-4 text-center text-[10px] text-gray-500 italic"
                                                >
                                                    No transactions found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {transactions.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-gray-100 font-bold">
                                                <td className="border border-black px-2 py-1 text-right text-[10px]" colSpan={4}>
                                                    TOTAL
                                                </td>
                                                <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                    {formatCurrency(totals.gross)}
                                                </td>
                                                <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                    {formatCurrency(totals.ewt)}
                                                </td>
                                                <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                    {formatCurrency(totals.vat)}
                                                </td>
                                                <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                    {formatCurrency(totals.net)}
                                                </td>
                                                <td className="border border-black px-2 py-1 text-[10px]">&nbsp;</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>

                                <div className="mt-8 text-center text-[9px] text-gray-500">
                                    <p>This is a computer-generated report and does not require a signature.</p>
                                </div>

                                <div className="mt-6">
                                    <PrintFFooter />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0 10mm; -webkit-print-color-adjust: exact; }
                    table { border-collapse: collapse; }
                    td, th { padding: 4px 6px !important; font-size: 10px; page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
}
