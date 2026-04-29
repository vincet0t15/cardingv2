import { NotificationItem } from '@/components/notifications/notification-item';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    notifiable_id?: number;
    notifiable_type?: string;
    is_read: boolean;
    actionable?: boolean;
    created_at: string;
    updated_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData {
    data: Notification[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
    },
    {
        title: 'Offices',
        href: '/settings/offices',
    },
];
export default function NotificationsIndex() {
    const { notifications } = usePage<{ notifications: PaginatedData }>().props;
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const [isProcessing, setIsProcessing] = useState<number | null>(null);

    const unreadCount = useMemo(() => {
        return notifications.data.filter((n) => !n.is_read).length;
    }, [notifications]);

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            const response = await fetch(route('notifications.mark-as-read', notificationId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                // Reload to update the UI
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;

        setIsMarkingAllRead(true);
        try {
            const response = await fetch(route('notifications.mark-all-read'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                toast.success('All notifications marked as read');
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            toast.error('Failed to mark notifications as read');
        } finally {
            setIsMarkingAllRead(false);
        }
    };

    const markNotificationAsRead = async (notificationId: number) => {
        try {
            const response = await fetch(route('notifications.mark-as-read', notificationId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            return false;
        }
    };

    const handleApproveDeleteRequest = async (notificationId: number) => {
        const notification = notifications.data.find((n) => n.id === notificationId);
        if (!notification?.notifiable_id) {
            toast.error('Invalid delete request');
            return;
        }

        setIsProcessing(notificationId);
        try {
            const response = await fetch(route('delete-requests.approve', notification.notifiable_id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                await markNotificationAsRead(notificationId);
                toast.success('Delete request approved');
                window.location.reload();
            } else {
                toast.error('Failed to approve delete request');
            }
        } catch (error) {
            console.error('Failed to approve delete request:', error);
            toast.error('Failed to approve delete request');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleRejectDeleteRequest = async (notificationId: number) => {
        const notification = notifications.data.find((n) => n.id === notificationId);
        if (!notification?.notifiable_id) {
            toast.error('Invalid delete request');
            return;
        }

        setIsProcessing(notificationId);
        try {
            const response = await fetch(route('delete-requests.reject', notification.notifiable_id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                await markNotificationAsRead(notificationId);
                toast.success('Delete request rejected');
                window.location.reload();
            } else {
                toast.error('Failed to reject delete request');
            }
        } catch (error) {
            console.error('Failed to reject delete request:', error);
            toast.error('Failed to reject delete request');
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>
                                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </CardDescription>
                        </div>
                        {unreadCount > 0 && (
                            <Button onClick={handleMarkAllAsRead} disabled={isMarkingAllRead} variant="outline" size="sm">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark all as read
                            </Button>
                        )}
                    </CardHeader>

                    <CardContent className="p-0">
                        {notifications.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-muted-foreground">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.data.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        id={notification.id}
                                        type={notification.type}
                                        title={notification.title}
                                        message={notification.message}
                                        link={notification.link}
                                        isRead={notification.is_read}
                                        createdAt={notification.created_at}
                                        notifiable_id={notification.notifiable_id}
                                        notifiable_type={notification.notifiable_type}
                                        onMarkAsRead={handleMarkAsRead}
                                        onApprove={
                                            notification.type === 'delete_request' && notification.actionable ? handleApproveDeleteRequest : undefined
                                        }
                                        onReject={
                                            notification.type === 'delete_request' && notification.actionable ? handleRejectDeleteRequest : undefined
                                        }
                                        alwaysShowActions={notification.type === 'delete_request'}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {notifications.last_page > 1 && <Pagination data={notifications} />}
            </div>
        </AppLayout>
    );
}
