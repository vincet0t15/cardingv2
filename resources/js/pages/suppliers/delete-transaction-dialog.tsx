import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SupplierTransaction } from '@/types/supplier';
import { useForm } from '@inertiajs/react';

interface Props {
    transaction: SupplierTransaction | null;
    onClose: () => void;
    supplierId: number;
}

export function DeleteTransactionDialog({ transaction, onClose, supplierId }: Props) {
    const form = useForm({});

    const handleDelete = () => {
        if (!transaction) return;
        form.delete(route('suppliers.transactions.destroy', [supplierId, transaction.id]), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog open={!!transaction} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Transaction</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the transaction <strong>PR #{transaction?.pr_no}</strong>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={form.processing}>
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
