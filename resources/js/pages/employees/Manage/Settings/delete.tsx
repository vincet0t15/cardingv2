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

import type { Employee } from '@/types/employee';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface DeleteEmployeeDialogProps {
    open: boolean;
    onClose: (open: boolean) => void;
    employee: Employee;
}

export function DeleteEmployeeDialog({ open, onClose, employee }: DeleteEmployeeDialogProps) {
    const onSubmit = () => {
        router.delete(route('employees.destroy', employee.id), {
            onSuccess: () => {
                toast.success('Employee deleted successfully.');
                onClose(false);
                router.get(route('employees.index'));
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(firstError || 'Failed to delete employee.');
            },
        });
    };

    const handleOpenChange = (isOpen: boolean) => {
        onClose(isOpen);
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="rounded-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the employee{' '}
                        <span className="font-bold">
                            {employee.last_name}, {employee.first_name}
                        </span>{' '}
                        and all associated records (salaries, deductions, claims, etc.) from our servers.
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
