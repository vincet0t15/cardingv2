import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Supplier } from '@/types/supplier';
import { useForm } from '@inertiajs/react';

interface DeleteSupplierDialogProps {
    supplier: Supplier | null;
    onClose: () => void;
}

export function DeleteSupplierDialog({ supplier, onClose }: DeleteSupplierDialogProps) {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        if (supplier) {
            destroy(route('suppliers.destroy', supplier.id), {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    return (
        <Dialog open={!!supplier} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Supplier</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{supplier?.name}</strong>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
