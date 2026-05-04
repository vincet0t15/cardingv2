import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import {
    AlertTriangle,
    Check,
    CheckCheck,
    CornerUpLeft,
    Download,
    Loader2,
    MoreHorizontal,
    Paperclip,
    PictureInPicture2Icon,
    Send,
    Trash2,
    Upload,
    Users,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GroupMembersDialog } from './group-members-dialog';
import { ImageLightbox } from './image-lightbox';
import { ConversationType, MessageType, UserType } from './message-types';

const STORAGE_URL = (path: string | null): string => {
    if (!path) return '';
    return new URL(`/storage/${path}`, window.location.origin).toString();
};

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

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === yesterday.toDateString())
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

function isDifferentDay(a: string, b: string): boolean {
    return new Date(a).toDateString() !== new Date(b).toDateString();
}

const AVATAR_COLORS = ['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500'];

function avatarColor(id: number) {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

const NAME_COLORS = [
    'text-sky-700 dark:text-sky-300',
    'text-indigo-700 dark:text-indigo-300',
    'text-violet-700 dark:text-violet-300',
    'text-fuchsia-700 dark:text-fuchsia-300',
    'text-rose-700 dark:text-rose-300',
    'text-amber-800 dark:text-amber-300',
    'text-emerald-700 dark:text-emerald-300',
    'text-cyan-700 dark:text-cyan-300',
    'text-blue-700 dark:text-blue-300',
    'text-purple-700 dark:text-purple-300',
] as const;

function throttle(func: (...args: any[]) => void, wait: number) {
    let timeout: NodeJS.Timeout | null = null;
    let lastRun = 0;
    return function executedFunction(...args: any[]) {
        const now = Date.now();
        if (now - lastRun >= wait) {
            func(...args);
            lastRun = now;
        } else if (!timeout) {
            timeout = setTimeout(
                () => {
                    func(...args);
                    lastRun = Date.now();
                    timeout = null;
                },
                wait - (now - lastRun),
            );
        }
    };
}

function nameColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return NAME_COLORS[hash % NAME_COLORS.length];
}

function csrfToken() {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
}

interface Props {
    activeConversation: ConversationType;
    initialMessages: MessageType[];
    auth: UserType;
    onlineUserIds: number[];
}

export function MessageThread({ activeConversation, initialMessages, auth, onlineUserIds }: Props) {
    const [messages, setMessages] = useState<MessageType[]>(initialMessages);
    const [input, setInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
    const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
    const [showMembers, setShowMembers] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState('');
    const [lightboxAlt, setLightboxAlt] = useState('');
    const [downloadingFile, setDownloadingFile] = useState<number | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const restoreScroll = useRef<{ h: number; t: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimers = useRef<{ [key: number]: number }>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevConversationIdRef = useRef<number | null>(null);

    const otherParticipant = useMemo(
        () => activeConversation.participants.find((p) => p.id !== auth.id) ?? null,
        [activeConversation.participants, auth.id],
    );

    const typingNames = useMemo(() => Object.values(typingUsers), [typingUsers]);

    const loadOlderMessages = useCallback(async () => {
        if (loadingOlder || !hasMore || messages.length === 0) return;
        const container = messagesContainerRef.current;
        if (container) {
            restoreScroll.current = { h: container.scrollHeight, t: container.scrollTop };
        }
        setLoadingOlder(true);
        try {
            const firstMessage = messages[0];
            const response = await fetch(`/messenger/${activeConversation.id}/messages?before=${firstMessage.id}`);
            const data = await response.json();
            if (data.messages.length < 50) setHasMore(false);
            setMessages((prev) => [...data.messages, ...prev]);
        } catch (error) {
            console.error('Failed to load older messages:', error);
        } finally {
            setLoadingOlder(false);
        }
    }, [activeConversation.id, hasMore, loadingOlder, messages]);

    useEffect(() => {
        // Only reset if we're actually changing to a different conversation
        const isConversationChange = prevConversationIdRef.current !== null && prevConversationIdRef.current !== activeConversation.id;

        if (prevConversationIdRef.current === null || isConversationChange) {
            setMessages(initialMessages);
            setHasMore(true);
            setLoadingOlder(false);
            setReplyingTo(null);
            setTypingUsers({});
            restoreScroll.current = null;
            // Clear saved scroll position for this conversation
            localStorage.removeItem(`messenger_scroll_${activeConversation.id}`);
        }
        prevConversationIdRef.current = activeConversation.id;
    }, [activeConversation.id, initialMessages]);

    useEffect(() => {
        // Save scroll position periodically when user scrolls through messages
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            localStorage.setItem(
                `messenger_scroll_${activeConversation.id}`,
                JSON.stringify({ top: container.scrollTop, height: container.scrollHeight }),
            );
        };

        const throttledScroll = throttle(handleScroll, 500);
        container.addEventListener('scroll', throttledScroll);
        return () => container.removeEventListener('scroll', throttledScroll);
    }, [activeConversation.id]);

    // Restore scroll position when messages load
    useEffect(() => {
        if (messages.length > 0 && messagesContainerRef.current) {
            requestAnimationFrame(() => {
                try {
                    const saved = localStorage.getItem(`messenger_scroll_${activeConversation.id}`);
                    if (saved) {
                        const { top } = JSON.parse(saved);
                        if (messagesContainerRef.current) {
                            messagesContainerRef.current.scrollTop = top;
                        }
                    } else {
                        // Default: scroll to bottom
                        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                    }
                } catch (e) {
                    // Ignore errors, fall back to scroll to bottom
                    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                }
            });
        }
    }, [messages.length, activeConversation.id]);

    useEffect(() => {
        if (!loadingOlder && restoreScroll.current && messagesContainerRef.current) {
            requestAnimationFrame(() => {
                if (messagesContainerRef.current && restoreScroll.current) {
                    const { h, t } = restoreScroll.current;
                    const newHeight = messagesContainerRef.current.scrollHeight;
                    messagesContainerRef.current.scrollTop = newHeight - h + t;
                    restoreScroll.current = null;
                }
            });
        }
    }, [loadingOlder]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const handleScroll = () => {
            if (container.scrollTop < 50 && !loadingOlder && hasMore) {
                loadOlderMessages();
            }
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [loadOlderMessages, loadingOlder, hasMore]);

    useEffect(() => {
        const channel = (echo() as any).private(`conversation.${activeConversation.id}`);

        channel.listen('ConversationMessageSent', (event: { message: MessageType }) => {
            setMessages((prev) => (prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]));
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            if (event.message.user.id !== auth.id) {
                fetch(`/messenger/${activeConversation.id}/messages/${event.message.id}/seen`, {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken() },
                }).catch((error) => console.error('Failed to mark message as seen:', error));
            }
        });

        channel.listen('ConversationMessageDeleted', (event: { message_id: number }) => {
            setMessages((prev) => prev.filter((m) => m.id !== event.message_id));
        });

        channel.listenForWhisper('typing', (event: { userId: number; name: string }) => {
            if (event.userId === auth.id) return;
            setTypingUsers((prev) => ({ ...prev, [event.userId]: event.name }));
            window.clearTimeout(typingTimers.current[event.userId]);
            typingTimers.current[event.userId] = window.setTimeout(() => {
                setTypingUsers((prev) => {
                    const next = { ...prev };
                    delete next[event.userId];
                    return next;
                });
            }, 3000);
        });

        return () => {
            (echo() as any).leave(`conversation.${activeConversation.id}`);
        };
    }, [activeConversation.id, auth.id]);

    useEffect(() => {
        fetch(`/messenger/${activeConversation.id}/read`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': csrfToken() },
        }).catch((error) => console.error('Failed to mark as read:', error));
    }, [activeConversation.id]);

    const handleTyping = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setInput(e.target.value);
            if (activeConversation.id) {
                (echo() as any).private(`conversation.${activeConversation.id}`).whisper('typing', {
                    userId: auth.id,
                    name: auth.name,
                });
            }
        },
        [activeConversation.id, auth.id, auth.name],
    );

    const sendMessage = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if ((!input.trim() && !selectedFile && !replyingTo) || sending) return;

            setSending(true);
            const socketId = (echo() as any).socketId?.() ?? null;
            const formData = new FormData();
            if (input.trim()) formData.append('body', input.trim());
            if (replyingTo) formData.append('reply_to_id', String(replyingTo.id));
            if (selectedFile) formData.append('file', selectedFile);

            const response = await fetch(`/messenger/${activeConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken(),
                    ...(socketId ? { 'X-Socket-ID': socketId } : {}),
                },
                body: formData,
            });

            if (response.ok) {
                const json = await response.json();
                setMessages((prev) => [...prev, json.message]);
                setInput('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setReplyingTo(null);
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                // Refocus on input after sending
                inputRef.current?.focus();
                router.reload({ only: ['conversations'] });
            }

            setSending(false);
        },
        [input, selectedFile, replyingTo, activeConversation.id, sending],
    );

    const deleteMessage = useCallback(
        async (messageId: number) => {
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
            try {
                await fetch(`/messenger/${activeConversation.id}/messages/${messageId}`, {
                    method: 'DELETE',
                    headers: { 'X-CSRF-TOKEN': csrfToken() },
                });
            } catch (error) {
                console.error('Failed to delete message:', error);
            }
        },
        [activeConversation.id],
    );

    const deleteGroup = useCallback(async () => {
        if (deleting) return;
        setDeleting(true);
        try {
            const response = await fetch(`/messenger/${activeConversation.id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': csrfToken() },
            });
            if (response.ok) {
                router.visit('/messenger');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete group');
            }
        } catch (error) {
            console.error('Failed to delete group:', error);
            alert('Failed to delete group');
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    }, [activeConversation.id, deleting]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    }, []);

    const openLightbox = (src: string, alt: string) => {
        setLightboxSrc(src);
        setLightboxAlt(alt);
        setLightboxOpen(true);
    };

    const handleDownload = async (messageId: number, url: string, fileName: string) => {
        setDownloadingFile(messageId);
        await downloadFile(url, fileName);
        setDownloadingFile(null);
    };

    const otherIsOnline = otherParticipant ? onlineUserIds.includes(otherParticipant.id) : false;

    return (
        <>
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-sidebar-border/50 flex items-center gap-3 border-b px-4 py-2.5">
                    <div className="relative shrink-0">
                        <div
                            className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white',
                                avatarColor(otherParticipant?.id ?? activeConversation.id),
                            )}
                        >
                            {activeConversation.is_group ? (
                                <Users className="h-4 w-4" />
                            ) : (
                                getInitials(otherParticipant ? otherParticipant.name : getConversationName(activeConversation, auth))
                            )}
                        </div>
                        {otherParticipant && otherIsOnline && (
                            <span className="border-background absolute right-0.5 bottom-0.5 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm leading-tight font-semibold">{getConversationName(activeConversation, auth)}</p>
                        <p className="text-muted-foreground text-xs">
                            {otherIsOnline
                                ? 'Active now'
                                : activeConversation.is_group
                                  ? `${activeConversation.participants.length} members`
                                  : 'Offline'}
                        </p>
                    </div>
                    {activeConversation.is_group && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:bg-muted ml-auto flex h-8 w-8 items-center justify-center rounded-full transition"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => setShowMembers(true)}>
                                    <Users className="mr-2 h-4 w-4" />
                                    View Members
                                </DropdownMenuItem>
                                {(activeConversation.created_by === auth.id || auth.is_admin) && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Group
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div
                    ref={messagesContainerRef}
                    className={cn('flex-1 overflow-y-auto px-4 py-3', isDragOver && 'rounded-lg ring-2 ring-blue-500 ring-inset')}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isDragOver && (
                        <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center bg-blue-500/10 backdrop-blur-[1px]">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
                                <Upload className="h-8 w-8 text-blue-500" />
                            </div>
                            <p className="mt-3 text-sm font-medium text-blue-600">Drop file to attach</p>
                        </div>
                    )}

                    <div className="flex w-full flex-col gap-0.5">
                        {loadingOlder && (
                            <div className="flex justify-center py-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        )}
                        {!hasMore && messages.length > 0 && <div className="text-muted-foreground py-2 text-center text-xs">No more messages</div>}
                        {messages.length === 0 && <div className="text-muted-foreground py-8 text-center text-sm">No messages yet. Say hi!</div>}
                        {messages.map((message, i) => {
                            const isMine = message.user.id === auth.id;
                            const prev = messages[i - 1];
                            const next = messages[i + 1];
                            const isFirstInGroup = prev?.user.id !== message.user.id;
                            const isLastInGroup = next?.user.id !== message.user.id;
                            const showAvatar = !isMine && isLastInGroup;
                            const showName = !isMine && isFirstInGroup && activeConversation.is_group;
                            const showDateSep = !prev || isDifferentDay(prev.created_at, message.created_at);

                            return (
                                <div key={message.id}>
                                    {showDateSep && (
                                        <div className="my-3 flex items-center justify-center">
                                            <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">
                                                {formatDateSeparator(message.created_at)}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            'group flex w-full items-end gap-1.5',
                                            isMine ? 'justify-end' : 'justify-start',
                                            !isLastInGroup && 'mb-0',
                                            isLastInGroup && 'mb-1',
                                        )}
                                        onMouseEnter={() => setHoveredMessageId(message.id)}
                                        onMouseLeave={() => setHoveredMessageId(null)}
                                    >
                                        {!isMine && (
                                            <div className={cn('mb-0.5 shrink-0', !showAvatar && 'opacity-0')}>
                                                <div
                                                    className={cn(
                                                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white',
                                                        avatarColor(message.user.id),
                                                    )}
                                                >
                                                    {getInitials(message.user.name)}
                                                </div>
                                            </div>
                                        )}

                                        {hoveredMessageId === message.id && isMine && (
                                            <div className="mb-1">
                                                <DropdownMenu modal={false}>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="text-muted-foreground/70 hover:bg-muted hover:text-foreground flex h-6 w-6 items-center justify-center rounded-full transition-all"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        sideOffset={5}
                                                        className="w-28 border-zinc-200 bg-white p-1 shadow-lg"
                                                    >
                                                        {message.file_path && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleDownload(message.id, STORAGE_URL(message.file_path), message.file_name!)
                                                                }
                                                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 focus:bg-zinc-100"
                                                            >
                                                                <Download className="h-3.5 w-3.5 text-zinc-500" />
                                                                <span>Download</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setReplyingTo(message);
                                                                inputRef.current?.focus();
                                                            }}
                                                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 focus:bg-zinc-100"
                                                        >
                                                            <CornerUpLeft className="h-3.5 w-3.5 text-zinc-500" />
                                                            <span>Reply</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-1 bg-zinc-200" />
                                                        <DropdownMenuItem
                                                            onClick={() => deleteMessage(message.id)}
                                                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}

                                        <div className={cn('flex max-w-[min(100%,20rem)] flex-col lg:max-w-sm xl:max-w-md', isMine && 'items-end')}>
                                            {showName && (
                                                <span className={cn('mb-0.5 px-3 text-xs font-medium', nameColor(message.user.name))}>
                                                    {message.user.name}
                                                </span>
                                            )}
                                            {message.reply_to && (
                                                <div
                                                    className={cn(
                                                        'rounded-2xl px-3 py-1.5 text-[11px] leading-tight opacity-80 transition-all',
                                                        isMine ? 'mr-2 bg-white/20' : 'bg-muted ml-2',
                                                    )}
                                                >
                                                    <p className="max-w-[150px] truncate text-zinc-500 italic">
                                                        {message.reply_to.body ?? '📎 Attachment'}
                                                    </p>
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    'px-3.5 py-2 text-sm leading-relaxed break-words',
                                                    isMine
                                                        ? 'bg-[#0b7ff5] text-white shadow-md shadow-blue-600/25'
                                                        : 'bg-card text-foreground shadow-sm ring-1 shadow-black/[0.06] ring-black/[0.04] dark:shadow-black/40 dark:ring-white/[0.07]',
                                                    isFirstInGroup && isLastInGroup && 'rounded-2xl',
                                                    isFirstInGroup &&
                                                        !isLastInGroup &&
                                                        (isMine
                                                            ? 'rounded-t-2xl rounded-br-sm rounded-bl-2xl'
                                                            : 'rounded-t-2xl rounded-br-2xl rounded-bl-sm'),
                                                    !isFirstInGroup &&
                                                        isLastInGroup &&
                                                        (isMine
                                                            ? 'rounded-tl-2xl rounded-tr-sm rounded-b-2xl'
                                                            : 'rounded-tl-sm rounded-tr-2xl rounded-b-2xl'),
                                                    !isFirstInGroup &&
                                                        !isLastInGroup &&
                                                        (isMine ? 'rounded-l-2xl rounded-r-sm' : 'rounded-l-sm rounded-r-2xl'),
                                                )}
                                            >
                                                <p className="whitespace-pre-wrap">{message.body}</p>
                                                {message.file_name && (
                                                    <div className="mt-2 max-w-xs">
                                                        {message.is_image ? (
                                                            <>
                                                                <button
                                                                    onClick={() => openLightbox(STORAGE_URL(message.file_path), message.file_name!)}
                                                                    className="border-muted hover:border-primary/50 block cursor-pointer rounded border p-0"
                                                                >
                                                                    <img
                                                                        src={STORAGE_URL(message.file_path)}
                                                                        alt={message.file_name}
                                                                        className="block h-auto max-h-48 w-full rounded object-cover"
                                                                    />
                                                                </button>
                                                                <p className="text-muted-foreground mt-1 truncate text-center text-xs">
                                                                    {message.file_name}
                                                                </p>
                                                            </>
                                                        ) : message.is_pdf ? (
                                                            <button
                                                                onClick={() =>
                                                                    handleDownload(message.id, STORAGE_URL(message.file_path), message.file_name!)
                                                                }
                                                                className="bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left transition-opacity hover:opacity-80"
                                                                disabled={downloadingFile === message.id}
                                                            >
                                                                <PictureInPicture2Icon className="text-muted-foreground h-5 w-5 shrink-0" />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-medium">{message.file_name}</p>
                                                                    <p className="text-muted-foreground truncate text-xs">
                                                                        {formatFileSize(message.file_size)}
                                                                    </p>
                                                                </div>
                                                                {downloadingFile === message.id && (
                                                                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() =>
                                                                    handleDownload(message.id, STORAGE_URL(message.file_path), message.file_name!)
                                                                }
                                                                className="bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left transition-opacity hover:opacity-80"
                                                                disabled={downloadingFile === message.id}
                                                            >
                                                                <Paperclip className="text-muted-foreground h-5 w-5 shrink-0" />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-medium">{message.file_name}</p>
                                                                    <p className="text-muted-foreground truncate text-xs">
                                                                        {formatFileSize(message.file_size)}
                                                                    </p>
                                                                </div>
                                                                {downloadingFile === message.id && (
                                                                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className={cn('mt-0.5 flex items-center gap-1 text-[10px] opacity-50', isMine ? 'mr-2' : 'ml-2')}>
                                                <span>{formatTime(message.created_at)}</span>
                                                {isMine && (
                                                    <span className="ml-0.5 inline-flex">
                                                        {message.seen_at ? (
                                                            <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                                        ) : (
                                                            <Check className="h-3.5 w-3.5 opacity-50" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!isMine && hoveredMessageId === message.id && (
                                            <div className="mb-1">
                                                <DropdownMenu modal={false}>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="text-muted-foreground/70 hover:bg-muted hover:text-foreground flex h-6 w-6 items-center justify-center rounded-full transition-all"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="start"
                                                        sideOffset={5}
                                                        className="w-28 border-zinc-200 bg-white p-1 shadow-lg"
                                                    >
                                                        {message.file_path && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleDownload(message.id, STORAGE_URL(message.file_path), message.file_name!)
                                                                }
                                                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 focus:bg-zinc-100"
                                                            >
                                                                <Download className="h-3.5 w-3.5 text-zinc-500" />
                                                                <span>Download</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setReplyingTo(message);
                                                                inputRef.current?.focus();
                                                            }}
                                                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 focus:bg-zinc-100"
                                                        >
                                                            <CornerUpLeft className="h-3.5 w-3.5 text-zinc-500" />
                                                            <span>Reply</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {typingNames.length > 0 && (
                            <div className="flex items-end gap-1.5">
                                <div
                                    className={cn(
                                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white',
                                        avatarColor(Object.keys(typingUsers).map(Number)[0] ?? 0),
                                    )}
                                >
                                    {getInitials(typingNames[0])}
                                </div>
                                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 dark:bg-slate-800">
                                    <div className="flex gap-1">
                                        <span className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]" />
                                        <span className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]" />
                                        <span className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="border-sidebar-border/50 border-t px-4 py-3">
                    {replyingTo && (
                        <div className="bg-muted/60 mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
                            <CornerUpLeft className="text-muted-foreground h-4 w-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    Replying to {replyingTo.user.id === auth.id ? 'yourself' : replyingTo.user.name}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">{replyingTo.body ?? '📎 Attachment'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="text-muted-foreground hover:text-foreground shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <form onSubmit={sendMessage} className="flex w-full flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={handleTyping}
                                placeholder="Aa"
                                disabled={sending}
                                autoComplete="off"
                                className="bg-muted/60 focus:bg-muted flex-1 rounded-full px-4 py-2.5 text-sm transition outline-none dark:bg-slate-800/60 dark:focus:bg-slate-800"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (input.trim() || selectedFile || replyingTo) {
                                            sendMessage(e as unknown as React.FormEvent);
                                        }
                                    }
                                }}
                            />
                            <label
                                htmlFor="file-input"
                                className="hover:text-muted-foreground/80 bg-muted/60 hover:bg-muted/80 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    id="file-input"
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSelectedFile(e.target.files[0]);
                                        }
                                    }}
                                    className="hidden"
                                />
                                <Paperclip className="h-4 w-4" />
                            </label>
                            <button
                                type="submit"
                                disabled={(!input.trim() && !selectedFile && !replyingTo) || sending}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b7ff5] text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-600 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        {selectedFile && (
                            <div className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2">
                                <div className="flex-shrink-0">
                                    {selectedFile.type && selectedFile.type.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-8 w-8 rounded object-cover" />
                                    ) : selectedFile.type === 'application/pdf' ? (
                                        <PictureInPicture2Icon className="text-muted-foreground h-8 w-8" />
                                    ) : (
                                        <Paperclip className="text-muted-foreground h-8 w-8" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                                    <p className="text-muted-foreground truncate text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="text-muted-foreground/50 ml-2 cursor-pointer hover:text-red-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {activeConversation.is_group && (
                <GroupMembersDialog
                    open={showMembers}
                    onOpenChange={setShowMembers}
                    conversationId={activeConversation.id}
                    authUserId={auth.id}
                    onLeaveSuccess={() => router.visit('/messenger')}
                />
            )}

            {showDeleteDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background w-full max-w-sm rounded-xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Delete Group</h3>
                                <p className="text-muted-foreground text-sm">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-4 text-sm">
                            Are you sure you want to delete <span className="font-medium">{activeConversation.name ?? 'this group'}</span>? All
                            messages will be permanently removed.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="hover:bg-muted flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteGroup}
                                disabled={deleting}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {lightboxOpen && <ImageLightbox src={lightboxSrc} alt={lightboxAlt} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />}
        </>
    );
}

function getConversationName(conversation: ConversationType, auth: UserType) {
    if (conversation.is_group) return conversation.name ?? 'Group Chat';
    return conversation.participants.find((p) => p.id !== auth.id)?.name ?? 'Unknown';
}
