import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SupplierTransaction } from '@/types/supplier';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { TransactionFields, TransactionForm, emptyTransactionForm } from './transaction-fields';

interface Props {
    transaction: SupplierTransaction | null;
    onClose: () => void;
    supplierId: number;
}

export function EditTransactionDialog({ transaction, onClose, supplierId }: Props) {
    const form = useForm<TransactionForm>(emptyTransactionForm);

    useEffect(() => {
        if (transaction) {
            form.setData({
                pr_date: transaction.pr_date,
                pr_no: transaction.pr_no,
                po_date: transaction.po_date || '',
                po_no: transaction.po_no || '',
                sale_invoice_date: transaction.sale_invoice_date || '',
                sale_invoice_no: transaction.sale_invoice_no || '',
                or_date: transaction.or_date || '',
                or_no: transaction.or_no || '',
                dr_date: transaction.dr_date || '',
                dr_no: transaction.dr_no || '',
                qty_period_covered: transaction.qty_period_covered || '',
                particulars: transaction.particulars,
                gross: String(transaction.gross),
                ewt: String(transaction.ewt),
                vat: String(transaction.vat),
                net_amount: String(transaction.net_amount),
                date_processed: transaction.date_processed || '',
                remarks: transaction.remarks || '',
            });
        }
    }, [transaction]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction) return;
        form.put(route('suppliers.transactions.update', [supplierId, transaction.id]), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog open={!!transaction} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] min-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                    <DialogDescription>Update the transaction record.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <TransactionFields prefix="edit" form={form} />
                    <div className="mt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Update Transaction
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
