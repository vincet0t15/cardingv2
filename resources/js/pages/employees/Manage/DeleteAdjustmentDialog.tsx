import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
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
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. Deleting an adjustment will remove it permanently.</AlertDialogDescription>
                </AlertDialogHeader>
                {adjustment && (
                    <div className="my-4 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-medium text-slate-900 dark:text-slate-100">Amount</span>
                            <span>{formatCurrency(adjustment.amount)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-medium text-slate-900 dark:text-slate-100">Period</span>
                            <span>
                                {new Date(2026, adjustment.pay_period_month - 1).toLocaleString('default', {
                                    month: 'short',
                                })}{' '}
                                {adjustment.pay_period_year}
                            </span>
                        </div>
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onSubmit} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
