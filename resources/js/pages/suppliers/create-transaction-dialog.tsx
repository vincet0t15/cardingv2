import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { TransactionFields, TransactionForm, emptyTransactionForm } from './transaction-fields';

interface Props {
    open: boolean;
    onClose: () => void;
    supplierId: number;
    supplierName: string;
}

export function CreateTransactionDialog({ open, onClose, supplierId, supplierName }: Props) {
    const form = useForm<TransactionForm>(emptyTransactionForm);

    useEffect(() => {
        if (!open) form.reset();
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('suppliers.transactions.store', supplierId), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] min-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>Add a new transaction record for {supplierName}.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <TransactionFields prefix="create" form={form} />
                    <div className="mt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Save Transaction
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
