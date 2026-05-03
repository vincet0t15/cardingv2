import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NotificationItem } from './notification-item';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationBellProps {
    className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const recentRes = await fetch(route('notifications.recent'));
            if (!recentRes.ok) throw new Error('Failed to fetch recent notifications');
            const recentData = await recentRes.json();
            setNotifications(recentData.notifications);

            try {
                const countRes = await fetch(route('notifications.unread-count'));
                if (countRes.ok) {
                    const countData = await countRes.json();
                    setUnreadCount(countData.count);
                } else {
                    console.error('Failed to fetch unread count, status:', countRes.status);
                    const unread = recentData.notifications.filter((n: Notification) => !n.is_read).length;
                    setUnreadCount(unread);
                }
            } catch (countError) {
                console.error('Failed to fetch unread count:', countError);
                const unread = recentData.notifications.filter((n: Notification) => !n.is_read).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(route('notifications.mark-all-read'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                console.error('Error marking all as read:', response.status, response.statusText);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setUnreadCount(0);
                setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={`relative h-10 w-10 ${className}`} title="Notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-transparent p-0 text-xs font-bold"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="hover:bg-muted h-auto px-2 py-1 text-xs" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div key={notification.id} onClick={() => setIsOpen(false)}>
                                    <NotificationItem
                                        id={notification.id}
                                        title={notification.title}
                                        message={notification.message}
                                        type={notification.type}
                                        link={notification.link}
                                        isRead={notification.is_read}
                                        createdAt={notification.created_at}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">No notifications</div>
                    )}
                </div>

                {/* Footer */}
                <Link href={route('notifications.index')} preserveState>
                    <div
                        className="bg-muted/30 hover:bg-muted cursor-pointer border-t px-4 py-2 text-center text-sm font-medium text-blue-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        View all notifications
                    </div>
                </Link>
            </PopoverContent>
        </Popover>
    );
}
