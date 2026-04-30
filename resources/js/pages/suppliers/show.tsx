import { CustomComboBox } from '@/components/CustomComboBox';
import PaginationData from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { PaginatedDataResponse } from '@/types/pagination';
import { Supplier, SupplierTransaction } from '@/types/supplier';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, FileText, PencilIcon, Plus, Printer, SearchIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreateTransactionDialog } from './create-transaction-dialog';
import { DeleteTransactionDialog } from './delete-transaction-dialog';
import { EditTransactionDialog } from './edit-transaction-dialog';

type PaginatedTransactions = PaginatedDataResponse<SupplierTransaction>;

interface Props {
    supplier: Supplier;
    transactions: PaginatedTransactions;
    search?: string | null;
    year?: string | null;
    month?: string | null;
    years: number[];
}

const formatDate = (d: string | null) => (d ? format(new Date(d), 'MMM dd, yyyy') : '—');
const formatCurrency = (v: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);

function DocRow({ label, date, number }: { label: string; date: string | null; number: string | null }) {
    if (!date && !number) return null;
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground text-xs font-medium">{label}</span>
            <div className="text-right text-xs">
                {date && <span className="font-medium">{formatDate(date)}</span>}
                {number && <span className="text-muted-foreground ml-2">#{number}</span>}
            </div>
        </div>
    );
}

function TransactionCard({
    txn,
    supplierId,
    onEdit,
    onDelete,
}: {
    txn: SupplierTransaction;
    supplierId: number;
    onEdit: (txn: SupplierTransaction) => void;
    onDelete: (txn: SupplierTransaction) => void;
}) {
    return (
        <Card className="overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-0">
                {/* Header */}
                <div className="bg-muted/40 flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <FileText className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-semibold">Transaction #{txn.id}</span>
                        {txn.date_processed && <span className="text-muted-foreground text-xs">• {formatDate(txn.date_processed)}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => router.get(route('suppliers.transactions.print', { supplier: supplierId, transaction: txn.id }))}
                        >
                            <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(txn)}>
                            <PencilIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" onClick={() => onDelete(txn)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
                    {/* Left: Documents */}
                    <div className="border-r p-4">
                        <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Documents</div>
                        <div className="space-y-0.5">
                            <DocRow label="PR" date={txn.pr_date} number={txn.pr_no} />
                            <DocRow label="PO" date={txn.po_date} number={txn.po_no} />
                            <DocRow label="Invoice" date={txn.sale_invoice_date} number={txn.sale_invoice_no} />
                            <DocRow label="OR" date={txn.or_date} number={txn.or_no} />
                            <DocRow label="DR" date={txn.dr_date} number={txn.dr_no} />
                            {txn.earmark && (
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground text-xs font-medium">Earmark No.</span>
                                    <div className="text-right text-xs">
                                        <span className="font-medium">{txn.earmark}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {txn.qty_period_covered && (
                            <>
                                <Separator className="my-2" />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs font-medium">Qty / Period</span>
                                    <span className="text-xs font-medium">{txn.qty_period_covered}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Middle: Particulars */}
                    <div className="border-r p-4">
                        <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Particulars</div>
                        <p className="text-sm leading-relaxed">{txn.particulars || '—'}</p>
                        {txn.remarks && (
                            <>
                                <Separator className="my-3" />
                                <div>
                                    <div className="text-muted-foreground mb-1 text-xs font-medium">Remarks</div>
                                    <p className="text-muted-foreground text-xs italic">{txn.remarks}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right: Financials */}
                    <div className="p-4">
                        <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Financial Summary</div>
                        <div className="space-y-0.5 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Gross Amount</span>
                                <span className="tabular-nums">{formatCurrency(txn.gross)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">EWT</span>
                                <span className="text-muted-foreground tabular-nums">- {formatCurrency(txn.ewt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">VAT</span>
                                <span className="text-muted-foreground tabular-nums">{formatCurrency(txn.vat)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Net Amount</span>
                                <span className="text-base font-bold text-green-600 tabular-nums">{formatCurrency(txn.net_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

const MONTHS = [
    { value: 'all', label: 'All months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

export default function SupplierShow({ supplier, transactions, search: initialSearch, year: initialYear, month: initialMonth, years }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<SupplierTransaction | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<SupplierTransaction | null>(null);
    const [search, setSearch] = useState(initialSearch || '');
    const [selectedYear, setSelectedYear] = useState(initialYear ?? 'all');
    const [selectedMonth, setSelectedMonth] = useState(initialMonth ?? 'all');

    const breadcrumbs = [
        { title: 'Suppliers', href: '/suppliers' },
        { title: supplier.name, href: route('suppliers.transactions.show', supplier.id) },
    ];

    const handleSearch = () => {
        router.get(
            route('suppliers.transactions.show', supplier.id),
            {
                search: search || undefined,
                year: selectedYear !== 'all' ? selectedYear : undefined,
                month: selectedMonth !== 'all' ? selectedMonth : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${supplier.name} — Transactions`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Supplier Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <Link href={route('suppliers.index')}>
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight">{supplier.name}</h1>
                                <Badge variant={supplier.is_active ? 'secondary' : 'destructive'} className="rounded-sm text-xs">
                                    {supplier.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="text-muted-foreground mt-0.5 flex flex-col gap-0.5 text-sm">
                                {supplier.address && <span>{supplier.address}</span>}
                                {supplier.contact_number && <span>{supplier.contact_number}</span>}
                                {supplier.email && <span>{supplier.email}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.get(
                                    route('suppliers.transactions.report', supplier.id),
                                    {
                                        search: search || undefined,
                                        year: selectedYear !== 'all' ? selectedYear : undefined,
                                        month: selectedMonth !== 'all' ? selectedMonth : undefined,
                                    },
                                    { preserveState: true, preserveScroll: true },
                                )
                            }
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Report
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Transaction
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex flex-wrap items-end gap-2">
                    <div className="relative max-w-sm flex-1">
                        <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Search transactions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-8"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <CustomComboBox
                            items={[{ value: 'all', label: 'All years' }, ...years.map((year) => ({ value: String(year), label: String(year) }))]}
                            placeholder="All years"
                            value={selectedYear}
                            onSelect={(value) => setSelectedYear(value ?? 'all')}
                            showClear
                        />
                        <CustomComboBox
                            items={MONTHS}
                            placeholder="All months"
                            value={selectedMonth}
                            onSelect={(value) => setSelectedMonth(value ?? 'all')}
                            showClear
                        />
                    </div>
                    <Button variant="outline" onClick={handleSearch}>
                        Search
                    </Button>
                </div>

                {/* Transactions Table */}
                <div className="w-full">
                    {transactions.data.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <FileText className="text-muted-foreground/50 mb-3 h-12 w-12" />
                                <p className="font-medium">No transactions yet</p>
                                <p className="text-muted-foreground text-sm">Click "Add Transaction" to create one.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="text-muted-foreground px-3 py-2 text-xs">PR Date</TableHead>
                                        <TableHead className="text-muted-foreground px-3 py-2 text-xs">PR No.</TableHead>
                                        <TableHead className="text-muted-foreground px-3 py-2 text-xs">Particulars</TableHead>
                                        <TableHead className="text-muted-foreground px-3 py-2 text-right text-xs">Gross</TableHead>
                                        <TableHead className="text-muted-foreground px-3 py-2 text-right text-xs">EWT</TableHead>
                                        <TableHead className="text-muted-foreground px-3 py-2 text-right text-xs">VAT</TableHead>
                                        <TableHead className="text-muted-foreground px-3 py-2 text-right text-xs">Net</TableHead>
                                        <TableHead className="text-muted-foreground px-3 py-2 text-xs">Earmark</TableHead>
                                        <TableHead className="text-muted-foreground px-3 py-2 text-xs">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.data.map((txn) => (
                                        <TableRow key={txn.id} className="border-t">
                                            <TableCell className="w-28 px-3 py-2 align-top">{formatDate(txn.pr_date)}</TableCell>
                                            <TableCell className="px-3 py-2 align-top">#{txn.pr_no}</TableCell>
                                            <TableCell className="max-w-xl truncate px-3 py-2 align-top">{txn.particulars || '—'}</TableCell>
                                            <TableCell className="px-3 py-2 text-right align-top tabular-nums">{formatCurrency(txn.gross)}</TableCell>
                                            <TableCell className="text-muted-foreground px-3 py-2 text-right align-top tabular-nums">
                                                - {formatCurrency(txn.ewt)}
                                            </TableCell>
                                            <TableCell className="px-3 py-2 text-right align-top tabular-nums">{formatCurrency(txn.vat)}</TableCell>
                                            <TableCell className="px-3 py-2 text-right align-top font-semibold text-green-600 tabular-nums">
                                                {formatCurrency(txn.net_amount)}
                                            </TableCell>
                                            <TableCell className="px-3 py-2 align-top">{txn.earmark || '—'}</TableCell>
                                            <TableCell className="px-3 py-2 align-top">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() =>
                                                            router.get(
                                                                route('suppliers.transactions.print', {
                                                                    supplier: supplier.id,
                                                                    transaction: txn.id,
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        <Printer className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => setEditingTransaction(txn)}
                                                    >
                                                        <PencilIcon className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive h-7 w-7"
                                                        onClick={() => setDeletingTransaction(txn)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <PaginationData data={transactions} />
            </div>

            <CreateTransactionDialog
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                supplierId={supplier.id}
                supplierName={supplier.name}
            />
            <EditTransactionDialog transaction={editingTransaction} onClose={() => setEditingTransaction(null)} supplierId={supplier.id} />
            <DeleteTransactionDialog transaction={deletingTransaction} onClose={() => setDeletingTransaction(null)} supplierId={supplier.id} />
        </AppLayout>
    );
}
