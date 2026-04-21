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
import { Claim } from '@/types/claim';

import { router } from '@inertiajs/react';
import { toast } from 'sonner';
interface DeleteClaimDialogProps {
    open: boolean;
    onClose: () => void;
    claim: Claim;
}
export function DeleteClaimDialog({ open, onClose, claim }: DeleteClaimDialogProps) {
    const onSubmit = () => {
        router.delete(route('claims.destroy', claim.id), {
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
                        This action cannot be undone. This will permanently delete the office <span className="font-bold">{claim.purpose}</span> from
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
