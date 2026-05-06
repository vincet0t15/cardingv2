import { type OpenChat, useChatContext, initializedConversations } from '@/contexts/chat-context';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { CornerUpLeft, Minus, Paperclip, Send, Upload, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MemoizedChatMessage } from './chat-message';
import { GroupMembersDialog } from './group-members-dialog';

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

function csrfToken() {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

const WINDOW_WIDTH = 320;
const GAP = 12;
const BASE_RIGHT = 20;

const CHAT_STYLE = `
@media (min-width: 768px) {
    [style*="--chat-height"] {
        right: var(--right-offset, 20px);
        height: var(--desktop-height);
        left: auto;
        bottom: 0;
    }
}
@media (max-width: 767px) {
    [style*="--chat-height"] {
        top: 80px;
        height: calc(100vh - 100px);
        right: 4px;
        left: 4px;
        bottom: 4px;
    }
}`;

interface Props {
    chat: OpenChat;
    index: number;
    extraRight?: number;
}

export function FloatingChat({ chat, index, extraRight = 0 }: Props) {
    const { auth } = usePage().props as unknown as { auth: { user: { id: number; name: string } } };
    const { closeChat, toggleMinimize, setConversation } = useChatContext();

    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(chat.conversation?.id ?? null);
    const [typingDots, setTypingDots] = useState(false);
    const [typingUser, setTypingUser] = useState<{ id: number; name: string } | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
    const [showMembers, setShowMembers] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [onlineUserId, setOnlineUserId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isNearBottom = useRef(true);
    const hasScrolledRef = useRef<Set<number>>(new Set());
    const isLoadingMoreRef = useRef(false);

    const displayName = useMemo(
        () => (chat.isGroup ? chat.conversation?.name ?? 'Group Chat' : chat.user?.name ?? chat.user?.username ?? 'Unknown'),
        [chat.isGroup, chat.conversation?.name, chat.user?.name, chat.user?.username],
    );
    const displayId = useMemo(() => (chat.isGroup ? chat.conversation?.id ?? 0 : chat.user?.id ?? 0), [chat.isGroup, chat.conversation?.id, chat.user?.id]);
    const rightOffset = useMemo(() => BASE_RIGHT + extraRight + index * (WINDOW_WIDTH + GAP), [extraRight, index]);

    const typingDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 96) + 'px';
        }
    }, [input]); // Track if we've scrolled for each conversation

    useEffect(() => {
        if (chat.minimized) return;

        const init = async () => {
            let convId = conversationId;

            if (!convId && !chat.isGroup) {
                if (initializedConversations.has(chat.user!.id)) {
                    setLoading(false);
                    return;
                }
                const res = await fetch('/messenger/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                    body: JSON.stringify({ user_ids: [chat.user!.id], is_group: false }),
                });
                if (!res.ok) {
                    setLoading(false);
                    return;
                }
                const { id } = await res.json();
                convId = id;
                setConversationId(id);
                setConversation(chat.chatId, {
                    id,
                    name: null,
                    is_group: false,
                    participants: [chat.user!],
                });
                initializedConversations.add(chat.user!.id);
            } else if (convId) {
                initializedConversations.add(convId);
            }

            // Clear scroll tracking for new conversation
            hasScrolledRef.current.delete(convId!);

            const res = await fetch(`/messenger/${convId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
                setHasMore(data.messages.length === 50);
            }
            setLoading(false);
        };

        init();
    }, [chat.chatId]);

    useEffect(() => {
        if (chat.isGroup || !chat.user?.id) return;

        const checkOnline = async () => {
            try {
                const res = await fetch(`/messenger/users/${chat.user!.id}/online`);
                if (res.ok) {
                    const { online } = await res.json();
                    setOnlineUserId(online ? chat.user!.id : null);
                }
            } catch {
                /* silent */
            }
        };

        checkOnline();
        const interval = setInterval(checkOnline, 30000);
        return () => clearInterval(interval);
    }, [chat.user?.id, chat.isGroup]);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const threshold = 80;
                    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                    isNearBottom.current = distanceFromBottom <= threshold;
                    ticking = false;
                });
                ticking = true;
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [loading]);

    useEffect(() => {
        // Only scroll to bottom on initial load (first time messages are loaded)
        if (!chat.minimized && conversationId && messages.length > 0 && !hasScrolledRef.current.has(conversationId) && !isLoadingMoreRef.current) {
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'auto' });
                hasScrolledRef.current.add(conversationId);
            });
        } else if (!chat.minimized && !isLoadingMoreRef.current && isNearBottom.current && messages.length > 0) {
            // Auto-scroll to bottom only if user is already near the bottom
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, chat.minimized, conversationId]);

    useEffect(() => {
        if (!chat.minimized && conversationId && !isLoadingMoreRef.current && !hasScrolledRef.current.has(conversationId)) {
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'auto' });
                hasScrolledRef.current.add(conversationId);
                inputRef.current?.focus();
            });
        } else if (!chat.minimized) {
            inputRef.current?.focus();
        }
    }, [chat.minimized, conversationId]);

    const fetchOlder = async () => {
        if (!conversationId || loadingMore || !hasMore || messages.length === 0) return;
        const oldestId = messages[0].id;
        const container = scrollRef.current;
        const prevScrollHeight = container?.scrollHeight ?? 0;

        isLoadingMoreRef.current = true;
        setLoadingMore(true);
        const res = await fetch(`/messenger/${conversationId}/messages?before=${oldestId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.messages.length > 0) {
                const newHasMore = data.messages.length === 50;
                setMessages((prev) => {
                    // Deduplicate by creating a set of existing IDs
                    const existingIds = new Set(prev.map((m) => m.id));
                    // Only add new messages that don't already exist
                    const newMessages = data.messages.filter((m: MessageType) => !existingIds.has(m.id));
                    const updated = [...newMessages, ...prev];
                    return updated;
                });
                setHasMore(newHasMore);
                requestAnimationFrame(() => {
                    if (container) {
                        container.scrollTop = container.scrollHeight - prevScrollHeight;
                    }
                    isLoadingMoreRef.current = false;
                });
            } else {
                setHasMore(false);
                isLoadingMoreRef.current = false;
            }
        } else {
            isLoadingMoreRef.current = false;
        }
        setLoadingMore(false);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (e.currentTarget.scrollTop === 0) {
            fetchOlder();
        }
    };

    useEffect(() => {
        if (!conversationId) return;

        const ch = (echo() as any).private(`conversation.${conversationId}`);

        ch.listen('ConversationMessageSent', (event: { message: MessageType }) => {
            setMessages((prev) => {
                const updated = prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message];
                return updated;
            });
            if (event.message.user.id !== auth.user.id && conversationId) {
                fetch(`/messenger/${conversationId}/messages/${event.message.id}/seen`, {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken() },
                });
            }
        });

        ch.listen('ConversationMessageDeleted', (event: { message_id: number }) => {
            setMessages((prev) => {
                const updated = prev.filter((m) => m.id !== event.message_id);
                return updated;
            });
        });

        ch.listenForWhisper('typing', (event: { userId: number; name: string }) => {
            if (event.userId === auth.user.id) return;
            setTypingUser({ id: event.userId, name: event.name });
            setTypingDots(true);
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setTypingDots(false), 3000);
        });

        return () => {
            if (typingTimer.current) clearTimeout(typingTimer.current);
            (echo() as any).leave(`conversation.${conversationId}`);
        };
    }, [conversationId, auth.user.id]);

    useEffect(() => {
        return () => {
            if (typingDebounceTimer.current) clearTimeout(typingDebounceTimer.current);
        };
    }, []);

    const sendMessage = useCallback(
        async (e?: React.FormEvent) => {
            if (e) e.preventDefault();
            if ((!input.trim() && !selectedFile) || !conversationId || sending) return;

            setSending(true);
            const socketId = (echo() as any).socketId?.() ?? null;

            const formData = new FormData();
            if (input.trim()) formData.append('body', input.trim());
            if (selectedFile) formData.append('file', selectedFile);
            if (replyingTo) formData.append('reply_to_id', String(replyingTo.id));

            const res = await fetch(`/messenger/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken(),
                    ...(socketId ? { 'X-Socket-ID': socketId } : {}),
                },
                body: formData,
            });

            if (res.ok) {
                const json = await res.json();
                setMessages((prev) => {
                    // Avoid duplicate if message already exists
                    const hasDuplicate = prev.some((m) => m.id === json.message.id);
                    const updated = hasDuplicate ? prev : [...prev, json.message];
                    return updated;
                });
                setInput('');
                setSelectedFile(null);
                setReplyingTo(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                // Reset textarea height
                if (inputRef.current) {
                    inputRef.current.style.height = 'auto';
                }
                // Refocus on input after sending - use requestAnimationFrame to ensure it happens after re-render
                requestAnimationFrame(() => {
                    inputRef.current?.focus();
                });
            } else {
                const error = await res.json().catch(() => null);
                console.error('Send message error:', res.status, error);
            }
            setSending(false);
        },
        [input, selectedFile, replyingTo, conversationId, hasMore, inputRef],
    );

    const deleteMessage = useCallback(
        async (msgId: number) => {
            if (!conversationId) return;
            setMessages((prev) => {
                const updated = prev.filter((m) => m.id !== msgId);
                return updated;
            });
            await fetch(`/messenger/${conversationId}/messages/${msgId}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': csrfToken() },
            });
        },
        [conversationId, hasMore],
    );

    const handleTyping = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInput(e.target.value);
            if (!conversationId) return;
            if (typingDebounceTimer.current) clearTimeout(typingDebounceTimer.current);
            typingDebounceTimer.current = setTimeout(() => {
                (echo() as any).private(`conversation.${conversationId}`).whisper('typing', {
                    userId: auth.user.id,
                    name: auth.user.name,
                });
            }, 300);
        },
        [conversationId, auth.user.id],
    );

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

    const messageItems = useMemo(
        () =>
            messages.map((msg, i) => {
                const isMe = msg.user.id === auth.user.id;
                const prevMsg = messages[i - 1];
                const showAvatar = !isMe && prevMsg?.user.id !== msg.user.id;
                return (
                    <MemoizedChatMessage
                        key={msg.id}
                        msg={msg}
                        prevMsg={prevMsg}
                        isMe={isMe}
                        showAvatar={showAvatar}
                        onReply={(m) => {
                            setReplyingTo(m);
                            inputRef.current?.focus();
                        }}
                        onDelete={deleteMessage}
                        conversationId={conversationId}
                    />
                );
            }),
        [messages, auth.user.id, deleteMessage, conversationId],
    );

    return (
        <>
            <div
                className="fixed top-16 right-2 bottom-0 left-2 z-50 flex min-h-0 w-auto flex-col overflow-hidden rounded-t-xl border border-zinc-200 shadow-2xl md:top-auto md:right-0 md:bottom-0 md:left-auto md:w-80 dark:border-zinc-700"
                style={
                    {
                        '--chat-height': chat.minimized ? '48px' : 'auto',
                        '--mobile-height': 'calc(100vh - 80px)',
                        '--desktop-height': '450px',
                        ['--right-offset' as string]: `${rightOffset}px`,
                    } as React.CSSProperties
                }
            >
                <style>{CHAT_STYLE}</style>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <button
                        onClick={() => toggleMinimize(chat.chatId)}
                        className={cn('flex h-12 shrink-0 cursor-pointer items-center gap-2 px-3 select-none', avatarColor(displayId))}
                    >
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                            {chat.isGroup ? <Users className="h-4 w-4" /> : getInitials(displayName)}
                            {!chat.isGroup && onlineUserId && (
                                <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                            )}
                        </div>
                        <span className="truncate text-sm font-semibold text-white">{displayName}</span>
                        <div className="ml-auto flex items-center gap-1">
                            {chat.isGroup && (
                                <span
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMembers(true);
                                    }}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-white/20"
                                >
                                    <Users className="h-3.5 w-3.5" />
                                </span>
                            )}
                            <span
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMinimize(chat.chatId);
                                }}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-white/20"
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </span>
                            <span
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeChat(chat.chatId);
                                }}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-white/20"
                            >
                                <X className="h-3.5 w-3.5" />
                            </span>
                        </div>
                    </button>

                    {!chat.minimized && (
                        <>
                            <div
                                className={cn('flex min-h-0 flex-1 flex-col', isDragOver && 'ring-2 ring-blue-500 ring-inset')}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {isDragOver && (
                                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-blue-500/10 backdrop-blur-[1px]">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
                                            <Upload className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <p className="mt-3 text-sm font-medium text-blue-600">Drop file to attach</p>
                                    </div>
                                )}

                                <div
                                    ref={scrollRef}
                                    onScroll={handleScroll}
                                    className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-white px-3 py-2 dark:bg-zinc-900"
                                >
                                    {loading ? (
                                        <div className="flex h-full items-center justify-center">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                        </div>
                                    ) : (
                                        <>
                                            {loadingMore && (
                                                <div className="flex justify-center py-2">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                                </div>
                                            )}
                                            {messages.length === 0 ? (
                                                <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                                                    <div
                                                        className={cn(
                                                            'flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white',
                                                            avatarColor(displayId),
                                                        )}
                                                    >
                                                        {chat.isGroup ? <Users className="h-8 w-8" /> : getInitials(displayName)}
                                                    </div>
                                                    <p className="mt-2 text-sm font-semibold">{displayName}</p>
                                                    <p className="text-xs text-zinc-400">
                                                        {chat.isGroup ? 'No messages yet' : 'Start a conversation'}
                                                    </p>
                                                </div>
                                            ) : (
                                                messageItems
                                            )}
                                            {typingDots && (
                                                <div className="animate-in fade-in-0 slide-in-from-bottom-1 flex items-end gap-1.5 duration-200">
                                                    <div
                                                        className={cn(
                                                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                                                            avatarColor(typingUser?.id ?? displayId),
                                                        )}
                                                    >
                                                        {getInitials(typingUser?.name ?? displayName)}
                                                    </div>
                                                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={bottomRef} />
                                        </>
                                    )}
                                </div>

                                <form onSubmit={sendMessage} className="flex flex-col border-t bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                    {replyingTo && (
                                        <div className="flex items-center gap-2 border-b bg-zinc-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800/60">
                                            <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                                    {replyingTo.user.id === auth.user.id ? 'Yourself' : replyingTo.user.name}
                                                </p>
                                                <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                                    {replyingTo.body ?? '📎 Attachment'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setReplyingTo(null)}
                                                className="shrink-0 text-zinc-400 hover:text-zinc-600"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    {selectedFile && (
                                        <div className="flex items-center gap-2 border-b px-3 py-1.5 dark:border-zinc-700">
                                            {selectedFile.type.startsWith('image/') ? (
                                                <img src={URL.createObjectURL(selectedFile)} alt="preview" className="h-8 w-8 rounded object-cover" />
                                            ) : (
                                                <Paperclip className="h-4 w-4 shrink-0 text-zinc-400" />
                                            )}
                                            <span className="flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">{selectedFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="text-zinc-400 hover:text-red-500"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-end gap-2 px-3 py-2">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={handleTyping}
                                            onPaste={(e) => {
                                                const items = e.clipboardData.items;
                                                for (let i = 0; i < items.length; i++) {
                                                    if (items[i].type.indexOf('image') !== -1) {
                                                        const file = items[i].getAsFile();
                                                        if (file) setSelectedFile(file);
                                                        break;
                                                    }
                                                }
                                            }}
                                            placeholder="Aa"
                                            rows={1}
                                            className="flex-1 max-h-24 rounded-2xl bg-zinc-100 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 resize-none dark:bg-zinc-800 dark:text-zinc-100 overflow-y-auto"
                                            disabled={sending}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (input.trim() || selectedFile || replyingTo) sendMessage(e as unknown as React.FormEvent);
                                                }
                                            }}
                                            style={{}}
                                        />
                                        <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf,.doc,.docx,.txt"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                                                }}
                                            />
                                            <Paperclip className="h-3.5 w-3.5" />
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={(!input.trim() && !selectedFile && !replyingTo) || sending}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}

                    {chat.isGroup && conversationId && (
                        <GroupMembersDialog
                            open={showMembers}
                            onOpenChange={setShowMembers}
                            conversationId={conversationId}
                            authUserId={auth.user.id}
                            onLeaveSuccess={() => closeChat(chat.chatId)}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
