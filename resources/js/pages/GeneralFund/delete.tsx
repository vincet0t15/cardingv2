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

import type { GeneralFund } from '@/types/generalFund';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface DeleteGeneralFundDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    dataToDelete: GeneralFund;
}

export function DeleteGeneralFundDialog({ open, setOpen, dataToDelete }: DeleteGeneralFundDialogProps) {
    const onSubmit = () => {
        router.delete(route('general-funds.destroy', dataToDelete.id), {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success);
                setOpen(false);
            },
            onError: (errors) => {
                const errorMsg = Object.values(errors).pop();
                if (errorMsg) {
                    toast.error(errorMsg);
                }
                setOpen(false);
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="rounded-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the general fund{' '}
                        <span className="font-bold">{dataToDelete.code}</span> from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onSubmit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
