import PrintFFooter from '@/components/print-footer';
import { Button } from '@/components/ui/button';
import { Supplier, SupplierTransaction } from '@/types/supplier';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

interface Props {
    supplier: Supplier;
    transaction: SupplierTransaction;
}

const formatDate = (d: string | null) => (d ? format(new Date(d), 'MMMM dd, yyyy') : '—');
const formatCurrency = (v: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(v);

function DocRow({ label, date, number }: { label: string; date: string | null; number: string | null }) {
    if (!date && !number) return null;
    return (
        <tr>
            <td className="border border-black px-2 py-1 text-[10px] font-medium">{label}</td>
            <td className="border border-black px-2 py-1 text-[10px]">{formatDate(date)}</td>
            <td className="border border-black px-2 py-1 text-[10px]">{number || '—'}</td>
        </tr>
    );
}

export default function PrintTransaction({ supplier, transaction }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const currentDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="mx-auto min-h-screen bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title={`Transaction #${transaction.id} — ${supplier.name}`} />

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
                                        SUPPLIER TRANSACTION REPORT
                                    </h2>
                                    <p className="m-[5px_0] text-[12px]">{supplier.name}</p>
                                    {supplier.address && <p className="m-0 text-[11px]">{supplier.address}</p>}
                                    {supplier.contact_number && <p className="m-0 text-[11px]">{supplier.contact_number}</p>}
                                    {supplier.email && <p className="m-0 text-[11px]">{supplier.email}</p>}
                                    <p className="m-0 text-[10px] text-gray-500">
                                        Transaction #{transaction.id.toString().padStart(6, '0')} • Generated: {currentDate}
                                    </p>
                                </div>

                                {/* Document References */}
                                <table className="mb-5 w-full border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold" colSpan={3}>
                                                DOCUMENT REFERENCES
                                            </th>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Document</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Date</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Reference No.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <DocRow label="Purchase Request (PR)" date={transaction.pr_date} number={transaction.pr_no} />
                                        <DocRow label="Purchase Order (PO)" date={transaction.po_date} number={transaction.po_no} />
                                        <DocRow label="Sales Invoice" date={transaction.sale_invoice_date} number={transaction.sale_invoice_no} />
                                        <DocRow label="Official Receipt (OR)" date={transaction.or_date} number={transaction.or_no} />
                                        <DocRow label="Delivery Receipt (DR)" date={transaction.dr_date} number={transaction.dr_no} />
                                    </tbody>
                                </table>

                                {/* Particulars */}
                                <table className="mb-5 w-full border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">PARTICULARS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-black px-2 py-2 text-[10px] leading-relaxed whitespace-pre-wrap">
                                                {transaction.particulars}
                                            </td>
                                        </tr>
                                        {transaction.qty_period_covered && (
                                            <tr className="bg-gray-50">
                                                <td className="border border-black px-2 py-1 text-[10px]">
                                                    <span className="font-medium">Qty / Period Covered: </span>
                                                    {transaction.qty_period_covered}
                                                </td>
                                            </tr>
                                        )}
                                        {transaction.remarks && (
                                            <tr className="bg-gray-50">
                                                <td className="border border-black px-2 py-1 text-[10px]">
                                                    <span className="font-medium">Remarks: </span>
                                                    <span className="italic">{transaction.remarks}</span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Financial Summary */}
                                <table className="mb-6 w-full border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold" colSpan={2}>
                                                FINANCIAL SUMMARY
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-black px-2 py-1 text-[10px] font-medium">Gross Amount</td>
                                            <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                {formatCurrency(transaction.gross)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-2 py-1 text-[10px] font-medium">Less: EWT (Withholding Tax)</td>
                                            <td className="border border-black px-2 py-1 text-right text-[10px] text-red-600 tabular-nums">
                                                - {formatCurrency(transaction.ewt)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-2 py-1 text-[10px] font-medium">VAT</td>
                                            <td className="border border-black px-2 py-1 text-right text-[10px] tabular-nums">
                                                {formatCurrency(transaction.vat)}
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50 font-bold">
                                            <td className="border border-black px-2 py-1 text-[11px]">NET AMOUNT</td>
                                            <td className="border border-black px-2 py-1 text-right text-[12px] text-green-600 tabular-nums">
                                                {formatCurrency(transaction.net_amount)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Signature Lines */}
                                <table className="mb-6 w-full border-0">
                                    <tbody>
                                        <tr>
                                            <td className="w-1/2 border-0 px-4 py-0">
                                                <div className="border-b border-dashed border-black pb-8" />
                                                <p className="mt-2 text-center text-[10px] text-gray-500">Prepared By</p>
                                            </td>
                                            <td className="w-1/2 border-0 px-4 py-0">
                                                <div className="border-b border-dashed border-black pb-8" />
                                                <p className="mt-2 text-center text-[10px] text-gray-500">Approved By</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

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
