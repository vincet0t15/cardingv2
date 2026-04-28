import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Adjustment } from './Adjustments';

interface DeleteAdjustmentDialogProps {
    open: boolean;
    onClose: () => void;
    adjustment: Adjustment | null;
}

export function DeleteAdjustmentDialog({ open, onClose, adjustment }: DeleteAdjustmentDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const onSubmit = () => {
        if (!adjustment) return;

        setIsDeleting(true);
        router.delete(route('adjustments.destroy', adjustment.id), {
            onSuccess: (response: { props: FlashProps }) => {
                const message = response.props.flash?.success;

                if (message?.includes('deletion request')) {
                    // User doesn't have permission - request was created
                    toast.info(message);
                } else {
                    // User has permission - direct deletion
                    toast.success(message || 'Adjustment deleted successfully');
                }

                onClose();
            },
            onError: (errors: Record<string, string[]>) => {
                const errorMessage = Object.values(errors)[0]?.[0] || 'Failed to delete adjustment';
                toast.error(errorMessage);
                setIsDeleting(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="rounded-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Adjustment</AlertDialogTitle>
                    <AlertDialogDescription>Are you sure you want to delete this adjustment? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-3">
                    {adjustment && (
                        <div className="space-y-2 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                            <div className="flex justify-between">
                                <span className="font-medium">Amount:</span>
                                <span>{formatCurrency(adjustment.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Period:</span>
                                <span>
                                    {new Date(2026, adjustment.pay_period_month - 1).toLocaleString('default', {
                                        month: 'short',
                                    })}{' '}
                                    {adjustment.pay_period_year}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onSubmit} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
