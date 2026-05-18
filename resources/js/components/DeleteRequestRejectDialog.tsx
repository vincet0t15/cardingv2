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
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

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

interface DeleteRequestRejectDialogProps {
    isOpen: boolean;
    request: DeleteRequest | null;
    onClose: () => void;
    onConfirm: (id: number, reason: string) => void;
    isLoading?: boolean;
}

export function DeleteRequestRejectDialog({ isOpen, request, onClose, onConfirm, isLoading = false }: DeleteRequestRejectDialogProps) {
    const [rejectReason, setRejectReason] = useState('');

    const getModelName = (type: string) => {
        return type.split('\\').pop() ?? type;
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setRejectReason('');
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm(request?.id || 0, rejectReason);
        setRejectReason('');
    };

    if (!request) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Reject Delete Request</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to reject this delete request for{' '}
                        <span className="font-semibold">{getModelName(request.requestable_type)}</span> (ID:{' '}
                        <span className="font-semibold">{request.requestable_id}</span>)?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                    {request.requestedBy && (
                        <div className="rounded-md bg-blue-50 p-3">
                            <p className="text-sm">
                                <span className="font-medium text-blue-900">Requested by:</span>{' '}
                                <span className="text-blue-800">{request.requestedBy.name}</span>
                            </p>
                        </div>
                    )}

                    {request.reason && (
                        <div className="space-y-2 rounded-md bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-600">Original Reason:</p>
                            <p className="text-sm text-slate-700">{request.reason}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            placeholder="Provide a reason for rejecting this delete request..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="resize-none"
                            rows={4}
                        />
                        <p className="text-xs text-slate-500">This reason will be shown to the requester.</p>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isLoading || !rejectReason.trim()}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isLoading ? 'Rejecting...' : 'Reject Request'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
