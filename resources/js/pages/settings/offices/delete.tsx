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
import { Badge } from '@/components/ui/badge';
import { useForm } from '@inertiajs/react';

import type { Office } from '@/types/office';
import { toast } from 'sonner';

interface DeleteOfficeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    office: Office;
}

function getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'pending':
            return 'secondary';
        case 'approved':
            return 'destructive';
        case 'rejected':
            return 'outline';
        default:
            return 'default';
    }
}

export function DeleteOfficeDialog({ isOpen, onClose, office }: DeleteOfficeDialogProps) {
    const { data, setData, post, processing, reset } = useForm({ reason: '' });
    const hasPendingRequest = office.deleteRequest?.status === 'pending';

    const onSubmit = () => {
        post(route('offices.destroy', office.id), {
            onSuccess: () => {
                toast.info('Your deletion request has been sent to administrators for approval.');
                reset();
                onClose();
            },
            onError: (errors) => {
                const errorMessage = (errors && Object.values(errors).flat().join(', ')) || 'Failed to delete office';
                toast.error(errorMessage);
            },
        });
    };

    const handleOpenChange = (open: boolean) => {
        onClose();
        if (!open) reset();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="rounded-md">
                <AlertDialogHeader>
                    <div className="flex items-start justify-between gap-3">
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        {office.deleteRequest && (
                            <Badge variant={getStatusColor(office.deleteRequest.status)} className="capitalize">
                                {office.deleteRequest.status}
                            </Badge>
                        )}
                    </div>
                    <AlertDialogDescription>
                        {hasPendingRequest ? (
                            <div className="space-y-2">
                                <p>
                                    You have already requested to delete this office <span className="font-bold">{office.name}</span>.
                                </p>
                                <p className="text-xs">Your request is pending admin approval. You will be notified once it has been reviewed.</p>
                            </div>
                        ) : (
                            <p>
                                This action cannot be undone. This will permanently delete the office <span className="font-bold">{office.name}</span>{' '}
                                from our servers.
                            </p>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {!hasPendingRequest && (
                    <div className="py-2">
                        <label className="text-sm font-medium">Reason for deletion (optional)</label>
                        <textarea
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder="Enter reason for deletion..."
                            className="mt-1 w-full rounded-md border p-2 text-sm"
                            rows={2}
                        />
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                    {!hasPendingRequest && (
                        <AlertDialogAction onClick={onSubmit} disabled={processing}>
                            {processing ? 'Submitting...' : 'Continue'}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
