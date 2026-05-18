import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AdjustmentType } from '@/types/adjustmentType';
import { router } from '@inertiajs/react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DeleteAdjustmentTypeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    adjustmentType: AdjustmentType;
}

export function DeleteAdjustmentTypeDialog({ isOpen, onClose, adjustmentType }: DeleteAdjustmentTypeDialogProps) {
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        setProcessing(true);
        router.delete(route('adjustment-types.destroy', adjustmentType.id), {
            onSuccess: () => {
                setProcessing(false);
                onClose();
            },
            onError: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Delete Adjustment Type
                    </DialogTitle>
                    <DialogDescription>Are you sure you want to delete "{adjustmentType.name}"? This action cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={processing}>
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
