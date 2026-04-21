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

import { SourceOfFundCode } from '@/types/sourceOfFundCOde';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
interface DeleteOfficeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    sourceOfFundCode: SourceOfFundCode;
}
export function DeleteSourceOfFundCode({ isOpen, onClose, sourceOfFundCode }: DeleteOfficeDialogProps) {
    const onSubmit = () => {
        router.delete(route('source-of-fund-codes.destroy', sourceOfFundCode.id), {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success);
                onClose();
            },
        });
    };
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="rounded-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the source of fund code{' '}
                        <span className="font-bold">{sourceOfFundCode.code}</span> from our servers.
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
