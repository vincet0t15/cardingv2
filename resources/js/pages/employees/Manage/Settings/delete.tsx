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
import { useState } from 'react';

import type { Employee } from '@/types/employee';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface DeleteEmployeeDialogProps {
    open: boolean;
    onClose: (open: boolean) => void;
    employee: Employee;
}

export function DeleteEmployeeDialog({ open, onClose, employee }: DeleteEmployeeDialogProps) {
    const [reason, setReason] = useState('');
    
    const onSubmit = () => {
        router.delete(route('employees.destroy', employee.id), {
            data: { reason },
            onSuccess: () => {
                onClose(false);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(firstError || 'Failed to delete employee.');
            },
        });
    };

    const handleOpenChange = (isOpen: boolean) => {
        onClose(isOpen);
        if (!isOpen) setReason('');
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
                <div className="py-2">
                    <label className="text-sm font-medium">Reason for deletion (optional)</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for deletion..."
                        className="mt-1 w-full rounded-md border p-2 text-sm"
                        rows={2}
                    />
                </div>
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
