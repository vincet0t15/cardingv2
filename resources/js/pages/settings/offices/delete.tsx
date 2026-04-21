import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import type { Office } from "@/types/office";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
interface DeleteOfficeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    office: Office
}
export function DeleteOfficeDialog({ isOpen, onClose, office }: DeleteOfficeDialogProps) {
    const onSubmit = () => {
        router.delete(route('offices.destroy', office.id), {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success);
                onClose();
            },
        });
    }
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose} >
            <AlertDialogContent className="rounded-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the office <span className="font-bold">{office.name}</span> from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onSubmit}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
