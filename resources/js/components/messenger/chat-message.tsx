import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, CornerUpLeft, Download, FileText, MoreHorizontal, Paperclip, Trash2 } from 'lucide-react';
import { memo, useEffect, useState, useCallback } from 'react';
import { ImageLightbox } from './image-lightbox';

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

function storageUrl(path: string | null): string {
    if (!path) return '';
    return new URL(`/storage/${path}`, window.location.origin).toString();
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
}

async function downloadFile(url: string, fileName: string) {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch {
        window.open(url, '_blank');
    }
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
    conversationId: number | null;
}

function ReadReceipt({ msg, isMe }: { msg: MessageType; isMe: boolean }) {
    if (!isMe) return null;
    const allSeen = !!msg.seen_at;
    return (
        <span className="ml-1 inline-flex shrink-0">
            {allSeen ? (
                <CheckCheck className="h-3.5 w-3.5 text-[#5b3df5]" />
            ) : (
                <Check className="h-3.5 w-3.5 opacity-50" />
            )}
        </span>
    );
}

export function ChatMessage({ msg, prevMsg, isMe, showAvatar, onReply, onDelete, conversationId }: ChatMessageProps) {
    const [deleting, setDeleting] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        setTimeout(() => onDelete(msg.id), 200);
    };

    const handleDownload = async () => {
        if (!msg.file_path || !msg.file_name || downloading) return;
        setDownloading(true);
        await downloadFile(storageUrl(msg.file_path), msg.file_name);
        setDownloading(false);
    };

    const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    const isImage = msg.mime_type ? msg.mime_type.startsWith('image/') : false;

    return (
        <>
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

                <div className={cn('relative flex max-w-[80%] flex-col', isMe ? 'items-end' : 'items-start')}>
                    {msg.reply_to && (
                        <div
                            className={cn(
                                'rounded-2xl px-3 py-1.5 text-[11px] leading-tight opacity-80 transition-all',
                                isMe ? 'mr-2 bg-zinc-100' : 'ml-2 bg-zinc-100',
                            )}
                        >
                            <p className="max-w-[150px] truncate text-zinc-500 italic">
                                {msg.reply_to.body ?? '📎 Attachment'}
                            </p>
                        </div>
                    )}

                    <div className={cn('relative flex items-end gap-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
                        <div
                            className={cn(
                                'max-w-[220px] rounded-[18px] px-4 py-2 text-[13px] shadow-sm',
                                isMe
                                    ? 'rounded-br-none bg-[#5b3df5] text-white'
                                    : 'rounded-bl-none border border-zinc-100 bg-white text-zinc-800',
                            )}
                        >
                            {msg.file_path && isImage ? (
                                <button
                                    onClick={() => setLightboxOpen(true)}
                                    className="block p-0"
                                >
                                    <img
                                        src={storageUrl(msg.file_path)}
                                        alt={msg.file_name ?? 'Image'}
                                        className="block max-h-32 w-auto rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                </button>
                            ) : msg.file_path ? (
                                <button
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="flex w-full items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity text-left"
                                >
                                    <FileText className="h-4 w-4 shrink-0 opacity-70" />
                                    <div className="min-w-0 max-w-[160px]">
                                        <p className="truncate text-xs font-medium">{msg.file_name}</p>
                                        <p className="truncate text-[10px] opacity-60">{formatFileSize(msg.file_size)}</p>
                                    </div>
                                    {downloading && (
                                        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                    )}
                                </button>
                            ) : null}
                            {msg.body && <span>{msg.body}</span>}
                        </div>

                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-600',
                                        'group-hover:opacity-100 opacity-0',
                                    )}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align={isMe ? 'end' : 'start'}
                                sideOffset={5}
                                className="w-28 border-zinc-200 bg-white p-1 shadow-lg"
                            >
                                {msg.file_path && (
                                    <DropdownMenuItem
                                        onClick={handleDownload}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 focus:bg-zinc-100"
                                    >
                                        <Download className="h-3.5 w-3.5 text-zinc-500" />
                                        <span>Download</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => onReply(msg)}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 focus:bg-zinc-100"
                                >
                                    <CornerUpLeft className="h-3.5 w-3.5 text-zinc-500" />
                                    <span>Reply</span>
                                </DropdownMenuItem>
                                {isMe && (
                                    <>
                                        <DropdownMenuSeparator className="my-1 bg-zinc-200" />
                                        <DropdownMenuItem
                                            onClick={handleDelete}
                                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className={cn('mt-0.5 flex items-center gap-1 text-[10px] opacity-50', isMe ? 'mr-2' : 'ml-2')}>
                        <span>{formattedTime}</span>
                        <ReadReceipt msg={msg} isMe={isMe} />
                    </div>
                </div>
            </div>

            {msg.file_path && isImage && (
                <ImageLightbox
                    src={storageUrl(msg.file_path)}
                    alt={msg.file_name ?? 'Image'}
                    open={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </>
    );
}

export const MemoizedChatMessage = memo(ChatMessage, (prevProps, nextProps) => {
    return (
        prevProps.msg.id === nextProps.msg.id &&
        prevProps.msg.body === nextProps.msg.body &&
        prevProps.msg.seen_at === nextProps.msg.seen_at &&
        prevProps.isMe === nextProps.isMe &&
        prevProps.showAvatar === nextProps.showAvatar
    );
});
