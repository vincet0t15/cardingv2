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

interface DeleteRequest {
    id: number;
    requestable_type: string;
    requestable_id: number;
    requested_by: number;
    status: string;
    reason: string;
    created_at: string;
    requestedBy?: {
        id: number;
        name: string;
        username: string;
    };
    requestable?: {
        id: number;
        name?: string;
        first_name?: string;
        last_name?: string;
        title?: string;
    };
}

interface DeleteRequestApproveDialogProps {
    isOpen: boolean;
    request: DeleteRequest | null;
    onClose: () => void;
    onConfirm: (id: number) => void;
    isLoading?: boolean;
}

export function DeleteRequestApproveDialog({ isOpen, request, onClose, onConfirm, isLoading = false }: DeleteRequestApproveDialogProps) {
    const getModelName = (type: string) => {
        return type.split('\\').pop() ?? type;
    };

    if (!request) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Approve Delete Request</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to approve this delete request for{' '}
                        <span className="font-semibold">{getModelName(request.requestable_type)}</span> (ID:{' '}
                        <span className="font-semibold">{request.requestable_id}</span>)?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-800">⚠️ Warning: This action will permanently delete the item and cannot be undone.</p>
                </div>

                {request.reason && (
                    <div className="space-y-2 rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-600">Deletion Reason:</p>
                        <p className="text-sm text-slate-700">{request.reason}</p>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConfirm(request.id)} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
                        {isLoading ? 'Approving...' : 'Approve Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
