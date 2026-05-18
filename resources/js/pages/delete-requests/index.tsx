import { DeleteRequestApproveDialog } from '@/components/DeleteRequestApproveDialog';
import { DeleteRequestRejectDialog } from '@/components/DeleteRequestRejectDialog';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    const [selectedApproveRequest, setSelectedApproveRequest] = useState<DeleteRequest | null>(null);
    const [selectedRejectRequest, setSelectedRejectRequest] = useState<DeleteRequest | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const currentTab = filters.status || 'all';

    const handleTabChange = (tab: string) => {
        if (tab === 'all') {
            router.get('/delete-requests');
        } else {
            router.get(`/delete-requests?status=${tab}`);
        }
    };

    const handleApprove = (id: number) => {
        setIsApproving(true);
        router.post(
            `/delete-requests/${id}/approve`,
            {},
            {
                onSuccess: () => {
                    toast.success('Delete request approved successfully');
                    setSelectedApproveRequest(null);
                    setIsApproving(false);
                },
                onError: () => {
                    toast.error('Failed to approve delete request');
                    setIsApproving(false);
                },
            },
        );
    };

    const handleReject = (id: number, reason: string) => {
        setIsRejecting(true);
        router.post(
            `/delete-requests/${id}/reject`,
            { reason },
            {
                onSuccess: () => {
                    toast.success('Delete request rejected');
                    setSelectedRejectRequest(null);
                    setIsRejecting(false);
                },
                onError: () => {
                    toast.error('Failed to reject delete request');
                    setIsRejecting(false);
                },
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

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Delete Requests" description="Review and manage delete requests from users" />

                <Tabs value={currentTab} onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    </TabsList>

                    <TabsContent value={currentTab} className="mt-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
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
                                                                onClick={() => setSelectedApproveRequest(request)}
                                                                className="h-8 text-green-600 hover:text-green-700"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setSelectedRejectRequest(request)}
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
                    </TabsContent>
                </Tabs>
            </div>

            {/* Approve Dialog */}
            <DeleteRequestApproveDialog
                isOpen={selectedApproveRequest !== null}
                request={selectedApproveRequest}
                onClose={() => setSelectedApproveRequest(null)}
                onConfirm={handleApprove}
                isLoading={isApproving}
            />

            {/* Reject Dialog */}
            <DeleteRequestRejectDialog
                isOpen={selectedRejectRequest !== null}
                request={selectedRejectRequest}
                onClose={() => setSelectedRejectRequest(null)}
                onConfirm={handleReject}
                isLoading={isRejecting}
            />
        </AppLayout>
    );
}
