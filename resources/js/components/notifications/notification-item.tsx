import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { AlertCircle, Check, Info, Trash2 } from 'lucide-react';

interface NotificationItemProps {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
    onMarkAsRead?: (id: number) => void;
    onDelete?: (id: number) => void;
    compact?: boolean;
}

export function NotificationItem({
    id,
    type,
    title,
    message,
    link,
    isRead,
    createdAt,
    onMarkAsRead,
    onDelete,
    compact = false,
}: NotificationItemProps) {
    const getIcon = () => {
        switch (type) {
            case 'delete_request':
                return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case 'approval':
                return <Check className="h-4 w-4 text-green-500" />;
            case 'warning':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const handleClick = () => {
        if (!isRead && onMarkAsRead) {
            onMarkAsRead(id);
        }
    };

    const content = (
        <div
            className={cn(
                'group hover:bg-muted/50 relative flex gap-3 transition-colors',
                !compact && 'border-b p-4',
                compact && 'p-3',
                !isRead && 'bg-blue-50/50 dark:bg-blue-950/20',
            )}
            onClick={handleClick}
        >
            <div className={cn('flex-shrink-0', compact ? 'mt-0.5' : 'mt-1')}>{getIcon()}</div>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className={cn('text-sm font-semibold', !isRead && 'font-bold')}>{title}</p>
                        <p className="text-muted-foreground line-clamp-2 text-sm">{message}</p>
                    </div>
                    {!isRead && <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{format(new Date(createdAt), 'MMM d, h:mm a')}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(id);
                        }}
                        className="rounded p-1 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                        title="Delete"
                    >
                        <Trash2 className="text-muted-foreground h-4 w-4 hover:text-red-600" />
                    </button>
                )}
            </div>
        </div>
    );

    if (link) {
        return <Link href={link}>{content}</Link>;
    }

    return content;
}
