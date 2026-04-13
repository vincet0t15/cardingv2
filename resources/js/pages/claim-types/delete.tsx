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
import { ClaimType } from '@/types/claimType';

import { router } from '@inertiajs/react';
import { toast } from 'sonner';
interface DeleteClaimTypeDialogProps {
    open: boolean;
    onClose: () => void;
    claimType: ClaimType;
}
export function DeleteClaimTypeDialog({ open, onClose, claimType }: DeleteClaimTypeDialogProps) {
    const onSubmit = () => {
        router.delete(route('claim-types.destroy', claimType.id), {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success);
                onClose();
            },
        });
    };
    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="rounded-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the office <span className="font-bold">{claimType.name}</span> from
                        our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onSubmit}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
