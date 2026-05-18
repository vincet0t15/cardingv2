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
import type { EmploymentStatus } from "@/types/employmentStatuses";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
interface DeleteEmploymentStatusDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employmentStatus: EmploymentStatus
}
export function DeleteEmploymentStatusDialog({ isOpen, onClose, employmentStatus }: DeleteEmploymentStatusDialogProps) {
    const onSubmit = () => {
        router.delete(route('employment-statuses.destroy', employmentStatus.id), {
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
                        This action cannot be undone. This will permanently delete the employment status <span className="font-bold">{employmentStatus.name}</span> from our servers.
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
