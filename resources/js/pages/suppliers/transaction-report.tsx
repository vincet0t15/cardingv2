import PrintFFooter from '@/components/print-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Supplier, SupplierTransaction } from '@/types/supplier';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Printer } from 'lucide-react';

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
        (acc, txn) => {
            return {
                gross: acc.gross + txn.gross,
                ewt: acc.ewt + txn.ewt,
                vat: acc.vat + txn.vat,
                net: acc.net + txn.net_amount,
            };
        },
        { gross: 0, ewt: 0, vat: 0, net: 0 },
    );

    return (
        <div className="mx-auto min-h-screen bg-white p-4 font-sans text-[12px] leading-6 text-black print:max-w-none print:p-0">
            <Head title={`${supplier.name} — Transaction Report`} />

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('suppliers.transactions.show', {
                            supplier: supplier.id,
                            ...(search ? { search } : {}),
                            ...(year ? { year } : {}),
                            ...(month ? { month } : {}),
                        })}
                    >
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Transactions
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold">Supplier Transaction Report</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <span>{year ? `Year: ${year}` : 'All years'}</span>
                            <span>{month ? `Month: ${MONTH_NAMES[parseInt(month, 10) - 1]}` : 'All months'}</span>
                            {search && <span>Search: {search}</span>}
                        </div>
                    </div>
                </div>
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>

            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 print:border-0 print:bg-transparent">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Supplier</p>
                        <p className="font-semibold">{supplier.name}</p>
                        {supplier.address && <p className="text-sm text-slate-700">{supplier.address}</p>}
                        {supplier.contact_number && <p className="text-sm text-slate-700">{supplier.contact_number}</p>}
                        {supplier.email && <p className="text-sm text-slate-700">{supplier.email}</p>}
                    </div>
                    <div>
                        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Report generated</p>
                        <p className="font-semibold">{new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-slate-700">Total transactions: {transactions.length}</p>
                        <p className="text-sm text-slate-700">Total net amount: {formatCurrency(totals.net)}</p>
                    </div>
                </div>
            </div>

            {transactions.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <p className="text-sm font-medium">No transactions found for this supplier.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="overflow-hidden border-black/10 print:border-black/10">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse text-left text-[11px] print:text-[10px]">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700">
                                        <th className="border border-black px-2 py-2">PR Date</th>
                                        <th className="border border-black px-2 py-2">PR No.</th>
                                        <th className="border border-black px-2 py-2">Particulars</th>
                                        <th className="border border-black px-2 py-2">Qty / Period</th>
                                        <th className="border border-black px-2 py-2">Gross</th>
                                        <th className="border border-black px-2 py-2">EWT</th>
                                        <th className="border border-black px-2 py-2">VAT</th>
                                        <th className="border border-black px-2 py-2">Net</th>
                                        <th className="border border-black px-2 py-2">Earmark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((txn) => (
                                        <tr key={txn.id} className="odd:bg-white even:bg-slate-50">
                                            <td className="border border-black px-2 py-1 align-top">{formatDate(txn.pr_date)}</td>
                                            <td className="border border-black px-2 py-1 align-top">{txn.pr_no}</td>
                                            <td className="border border-black px-2 py-1 align-top">{txn.particulars || '—'}</td>
                                            <td className="border border-black px-2 py-1 align-top">{txn.qty_period_covered || '—'}</td>
                                            <td className="border border-black px-2 py-1 text-right align-top tabular-nums">
                                                {formatCurrency(txn.gross)}
                                            </td>
                                            <td className="border border-black px-2 py-1 text-right align-top tabular-nums">
                                                {formatCurrency(txn.ewt)}
                                            </td>
                                            <td className="border border-black px-2 py-1 text-right align-top tabular-nums">
                                                {formatCurrency(txn.vat)}
                                            </td>
                                            <td className="border border-black px-2 py-1 text-right align-top font-semibold text-green-600 tabular-nums">
                                                {formatCurrency(txn.net_amount)}
                                            </td>
                                            <td className="border border-black px-2 py-1 align-top">{txn.earmark || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 font-semibold">
                                        <td className="border border-black px-2 py-2 text-right" colSpan={4}>
                                            Totals
                                        </td>
                                        <td className="border border-black px-2 py-2 text-right tabular-nums">{formatCurrency(totals.gross)}</td>
                                        <td className="border border-black px-2 py-2 text-right tabular-nums">{formatCurrency(totals.ewt)}</td>
                                        <td className="border border-black px-2 py-2 text-right tabular-nums">{formatCurrency(totals.vat)}</td>
                                        <td className="border border-black px-2 py-2 text-right tabular-nums">{formatCurrency(totals.net)}</td>
                                        <td className="border border-black px-2 py-2">&nbsp;</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="mt-6 print:mt-12">
                <PrintFFooter />
            </div>

            <style>{`
                @media print {
                    @page { margin: 10mm; size: auto; }
                    body { margin: 0; -webkit-print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
