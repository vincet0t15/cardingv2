import { DatePicker } from '@/components/custom-date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';

export type TransactionForm = {
    pr_date: string;
    pr_no: string;
    po_date: string;
    po_no: string;
    sale_invoice_date: string;
    sale_invoice_no: string;
    or_date: string;
    or_no: string;
    dr_date: string;
    dr_no: string;
    qty_period_covered: string;
    particulars: string;
    gross: string;
    ewt: string;
    vat: string;
    net_amount: string;
    date_processed: string;
    remarks: string;
    earmark: string;
};

export const emptyTransactionForm: TransactionForm = {
    pr_date: '',
    pr_no: '',
    po_date: '',
    po_no: '',
    sale_invoice_date: '',
    sale_invoice_no: '',
    or_date: '',
    or_no: '',
    dr_date: '',
    dr_no: '',
    qty_period_covered: '',
    particulars: '',
    gross: '',
    ewt: '',
    vat: '',
    net_amount: '',
    date_processed: '',
    remarks: '',
    earmark: '',
};

interface TransactionFieldsProps {
    prefix: string;
    form: ReturnType<typeof useForm<TransactionForm>>;
}

export function TransactionFields({ prefix, form }: TransactionFieldsProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_pr_date`}>PR Date *</Label>
                    <DatePicker id={`${prefix}_pr_date`} value={form.data.pr_date} onChange={(v) => form.setData('pr_date', v)} />
                    {form.errors.pr_date && <p className="text-xs text-red-500">{form.errors.pr_date}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_pr_no`}>PR No. *</Label>
                    <Input
                        id={`${prefix}_pr_no`}
                        value={form.data.pr_no}
                        onChange={(e) => form.setData('pr_no', e.target.value)}
                        placeholder="PR Number"
                        required
                    />
                    {form.errors.pr_no && <p className="text-xs text-red-500">{form.errors.pr_no}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_po_date`}>PO Date</Label>
                    <DatePicker
                        id={`${prefix}_po_date`}
                        value={form.data.po_date}
                        onChange={(v) => form.setData('po_date', v)}
                        placeholder="Select PO date"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_po_no`}>PO No.</Label>
                    <Input
                        id={`${prefix}_po_no`}
                        value={form.data.po_no}
                        onChange={(e) => form.setData('po_no', e.target.value)}
                        placeholder="PO Number"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_si_date`}>Sale Invoice Date</Label>
                    <DatePicker
                        id={`${prefix}_si_date`}
                        value={form.data.sale_invoice_date}
                        onChange={(v) => form.setData('sale_invoice_date', v)}
                        placeholder="Select invoice date"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_si_no`}>Sale Invoice No.</Label>
                    <Input
                        id={`${prefix}_si_no`}
                        value={form.data.sale_invoice_no}
                        onChange={(e) => form.setData('sale_invoice_no', e.target.value)}
                        placeholder="Invoice Number"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_or_date`}>OR Date</Label>
                    <DatePicker
                        id={`${prefix}_or_date`}
                        value={form.data.or_date}
                        onChange={(v) => form.setData('or_date', v)}
                        placeholder="Select OR date"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_or_no`}>OR No.</Label>
                    <Input
                        id={`${prefix}_or_no`}
                        value={form.data.or_no}
                        onChange={(e) => form.setData('or_no', e.target.value)}
                        placeholder="OR Number"
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_dr_date`}>D.R. Date</Label>
                    <DatePicker
                        id={`${prefix}_dr_date`}
                        value={form.data.dr_date}
                        onChange={(v) => form.setData('dr_date', v)}
                        placeholder="Select D.R. date"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_dr_no`}>D.R. No.</Label>
                    <Input
                        id={`${prefix}_dr_no`}
                        value={form.data.dr_no}
                        onChange={(e) => form.setData('dr_no', e.target.value)}
                        placeholder="DR Number"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_earmark`}>Earmark No.</Label>
                    <Input
                        id={`${prefix}_earmark`}
                        value={form.data.earmark}
                        onChange={(e) => form.setData('earmark', e.target.value)}
                        placeholder="Earmark Number"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${prefix}_qty`}>QTY / Period Covered</Label>
                <Input
                    id={`${prefix}_qty`}
                    value={form.data.qty_period_covered}
                    onChange={(e) => form.setData('qty_period_covered', e.target.value)}
                    placeholder="Quantity or period"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`${prefix}_particulars`}>Particulars *</Label>
                <Textarea
                    id={`${prefix}_particulars`}
                    value={form.data.particulars}
                    onChange={(e) => form.setData('particulars', e.target.value)}
                    rows={2}
                    required
                />
                {form.errors.particulars && <p className="text-xs text-red-500">{form.errors.particulars}</p>}
            </div>
            <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_gross`}>Gross *</Label>
                    <Input
                        id={`${prefix}_gross`}
                        type="number"
                        step="0.01"
                        value={form.data.gross}
                        onChange={(e) => form.setData('gross', e.target.value)}
                        placeholder="0.00"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_ewt`}>EWT</Label>
                    <Input
                        id={`${prefix}_ewt`}
                        type="number"
                        step="0.01"
                        value={form.data.ewt}
                        onChange={(e) => form.setData('ewt', e.target.value)}
                        placeholder="0.00"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_vat`}>VAT</Label>
                    <Input
                        id={`${prefix}_vat`}
                        type="number"
                        step="0.01"
                        value={form.data.vat}
                        onChange={(e) => form.setData('vat', e.target.value)}
                        placeholder="0.00"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_net`}>Net Amount *</Label>
                    <Input
                        id={`${prefix}_net`}
                        type="number"
                        step="0.01"
                        value={form.data.net_amount}
                        onChange={(e) => form.setData('net_amount', e.target.value)}
                        placeholder="0.00"
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_date_processed`}>Date Processed</Label>
                    <DatePicker
                        id={`${prefix}_date_processed`}
                        value={form.data.date_processed}
                        onChange={(v) => form.setData('date_processed', v)}
                        placeholder="Select date processed"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${prefix}_remarks`}>Remarks</Label>
                    <Input
                        id={`${prefix}_remarks`}
                        value={form.data.remarks}
                        onChange={(e) => form.setData('remarks', e.target.value)}
                        placeholder="Notes"
                    />
                </div>
            </div>
        </div>
    );
}
