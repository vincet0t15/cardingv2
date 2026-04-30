import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CornerUpLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

const AVATAR_COLORS = ['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500'];

function avatarColor(id: number) {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

interface MessageType {
    id: number;
    body: string | null;
    reply_to_id: number | null;
    reply_to: { id: number; body: string | null; user: { id: number; name: string } } | null;
    file_name: string | null;
    file_path: string | null;
    file_type: string | null;
    file_size: number | null;
    mime_type: string | null;
    created_at: string;
    seen_at: string | null;
    seen_by: number | null;
    user: { id: number; name: string };
}

interface ChatMessageProps {
    msg: MessageType;
    prevMsg: MessageType | undefined;
    isMe: boolean;
    showAvatar: boolean;
    onReply: (msg: MessageType) => void;
    onDelete: (msgId: number) => void;
}

export function ChatMessage({ msg, prevMsg, isMe, showAvatar, onReply, onDelete }: ChatMessageProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        setTimeout(() => onDelete(msg.id), 200);
    };

    const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div
            className={cn(
                'group relative flex items-start gap-2',
                isMe ? 'flex-row-reverse' : 'flex-row',
                'animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
                deleting && 'animate-out fade-out-0 zoom-out-95 duration-200',
            )}
        >
            {!isMe && (
                <div
                    className={cn(
                        'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                        showAvatar ? avatarColor(msg.user.id) : 'invisible',
                    )}
                >
                    {getInitials(msg.user.name)}
                </div>
            )}

            <div className={cn('flex max-w-[80%] flex-col', isMe ? 'items-end' : 'items-start')}>
                {msg.reply_to && (
                    <div
                        className={cn(
                            'relative rounded-2xl px-3 pt-2 pb-5 text-[11px] leading-tight opacity-80 transition-all',
                            isMe ? 'mr-2 bg-zinc-100' : 'ml-2 bg-zinc-100',
                        )}
                    >
                        <p className="max-w-[150px] truncate text-zinc-500 italic">
                            {msg.reply_to.body ?? '📎 Attachment'}
                        </p>
                    </div>
                )}

                <div
                    className={cn(
                        'relative z-10 -mt-4 rounded-[18px] px-4 py-2 text-[13px] shadow-sm transition-all',
                        isMe
                            ? 'rounded-br-none bg-[#5b3df5] text-white'
                            : 'rounded-bl-none border border-zinc-100 bg-white text-zinc-800',
                    )}
                >
                    {msg.body && <span>{msg.body}</span>}
                </div>

                <div className={cn('mt-1 flex gap-1.5 text-[10px] opacity-50', isMe ? 'mr-1' : 'ml-1')}>
                    <span>{formattedTime}</span>
                    {isMe && msg.seen_at && <span className="font-medium text-[#5b3df5]">Seen</span>}
                </div>
            </div>

            <div
                className={cn(
                    'mt-2 transition-opacity duration-200',
                    'group-hover:opacity-100 opacity-0',
                )}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align={isMe ? 'end' : 'start'}
                        className="w-28 min-w-[110px] border-zinc-100 p-1 shadow-md"
                    >
                        <DropdownMenuItem
                            onClick={() => onReply(msg)}
                            className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[12px] focus:bg-zinc-50"
                        >
                            <CornerUpLeft className="h-3 w-3 opacity-70" />
                            <span>Reply</span>
                        </DropdownMenuItem>

                        {isMe && (
                            <>
                                <DropdownMenuSeparator className="my-1 bg-zinc-100" />
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[12px] text-red-500 focus:bg-red-50 focus:text-red-600"
                                >
                                    <Trash2 className="h-3 w-3 opacity-70" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
