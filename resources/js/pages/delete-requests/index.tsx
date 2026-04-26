import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Delete Requests', href: '/delete-requests' },
];

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
    approvedBy?: {
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

interface DeleteRequestsIndexProps {
    deleteRequests: PaginatedDataResponse<DeleteRequest>;
    filters: { status?: string };
}

export default function DeleteRequestsIndex({ deleteRequests, filters }: DeleteRequestsIndexProps) {
    const [selectedRequest, setSelectedRequest] = useState<DeleteRequest | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = (id: number) => {
        if (!confirm('Are you sure you want to approve this delete request? The item will be permanently deleted.')) return;

        router.post(
            `/delete-requests/${id}/approve`,
            {},
            {
                onSuccess: () => toast.success('Delete request approved successfully'),
                onError: () => toast.error('Failed to approve delete request'),
            },
        );
    };

    const handleReject = (id: number) => {
        router.post(
            `/delete-requests/${id}/reject`,
            { reason: rejectReason },
            {
                onSuccess: () => {
                    toast.success('Delete request rejected');
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedRequest(null);
                },
                onError: () => toast.error('Failed to reject delete request'),
            },
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline">Pending</Badge>;
            case 'approved':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getModelName = (type: string) => {
        return type.split('\\').pop() ?? type;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Delete Requests" />

            <div className="space-y-4">
                <Heading title="Delete Requests" description="Review and manage delete requests from users" />

                <div className="flex gap-2">
                    <Button variant={!filters.status ? 'default' : 'outline'} size="sm" onClick={() => router.get('/delete-requests')}>
                        All
                    </Button>
                    <Button
                        variant={filters.status === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => router.get('/delete-requests?status=pending')}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={filters.status === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => router.get('/delete-requests?status=approved')}
                    >
                        Approved
                    </Button>
                    <Button
                        variant={filters.status === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => router.get('/delete-requests?status=rejected')}
                    >
                        Rejected
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Item ID</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deleteRequests.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                                        No delete requests found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                deleteRequests.data.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">#{request.id}</TableCell>
                                        <TableCell>{getModelName(request.requestable_type)}</TableCell>
                                        <TableCell>{request.requestable_id}</TableCell>
                                        <TableCell>{request.requestedBy?.name ?? 'Unknown'}</TableCell>
                                        <TableCell className="max-w-xs truncate">{request.reason ?? '-'}</TableCell>
                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                        <TableCell>
                                            <div className="text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {request.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleApprove(request.id)}
                                                        className="h-8 text-green-600 hover:text-green-700"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowRejectModal(true);
                                                        }}
                                                        className="h-8 text-red-600 hover:text-red-700"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination data={deleteRequests} />
            </div>

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                        <h3 className="mb-4 text-lg font-semibold">Reject Delete Request</h3>
                        <p className="text-muted-foreground mb-4">
                            Are you sure you want to reject this delete request for {getModelName(selectedRequest.requestable_type)} (ID:{' '}
                            {selectedRequest.requestable_id})?
                        </p>
                        <div className="mb-4">
                            <label className="text-sm font-medium">Reason (optional)</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="mt-1 w-full rounded-md border p-2"
                                rows={3}
                                placeholder="Enter reason for rejection..."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedRequest(null);
                                    setRejectReason('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={() => handleReject(selectedRequest.id)}>
                                Reject Request
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
