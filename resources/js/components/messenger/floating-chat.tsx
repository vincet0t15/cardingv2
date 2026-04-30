import { type OpenChat, useChatContext } from '@/contexts/chat-context';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { CornerUpLeft, Eye, Minus, Paperclip, Send, Trash2, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

interface Props {
    chat: OpenChat;
    index: number;
    extraRight?: number;
}

export function FloatingChat({ chat, index, extraRight = 0 }: Props) {
    const { auth } = usePage().props as unknown as { auth: { user: { id: number; name: string } } };
    const { closeChat, toggleMinimize, setConversation } = useChatContext();
    const displayName = chat.isGroup ? (chat.conversation?.name ?? 'Group Chat') : (chat.user?.name ?? '');
    const displayId = chat.isGroup ? (chat.conversation?.id ?? 0) : (chat.user?.id ?? 0);

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
    const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Step 1: resolve conversation (create if needed) ──────────────────────
    useEffect(() => {
        if (chat.minimized) return;

        const init = async () => {
            let convId = conversationId;

            if (!convId && !chat.isGroup) {
                // Create a DM conversation
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
            }

            // Load messages
            const res = await fetch(`/messenger/${convId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
                setHasMore(data.messages.length === 50);
            }
            setLoading(false);
        };

        init();
        // Only run when the chat opens/conversation initializes; not on every minimized change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chat.chatId]);

    // ── Step 2: scroll to bottom when opened (not when prepending old messages) ──
    const isLoadingMoreRef = useRef(false);
    useEffect(() => {
        if (!chat.minimized && !isLoadingMoreRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' });
            inputRef.current?.focus();
        }
    }, [chat.minimized, messages.length]);

    // ── Step 2b: load older messages when scrolled to top ───────────────────
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
                setMessages((prev) => [...data.messages, ...prev]);
                setHasMore(data.messages.length === 50);
                // Restore scroll position so view doesn't jump
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

    // ── Step 3: WebSocket subscription ──────────────────────────────────────
    useEffect(() => {
        if (!conversationId) return;

        const ch = (echo() as any).private(`conversation.${conversationId}`);

        ch.listen('ConversationMessageSent', (event: { message: MessageType }) => {
            setMessages((prev) => (prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]));
            // Mark message as seen if chat is open
            if (event.message.user.id !== auth.user.id && conversationId) {
                fetch(`/messenger/${conversationId}/messages/${event.message.id}/seen`, {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken() },
                });
            }
        });

        ch.listen('ConversationMessageDeleted', (event: { message_id: number }) => {
            setMessages((prev) => prev.filter((m) => m.id !== event.message_id));
        });

        ch.listenForWhisper('typing', (event: { userId: number; name: string }) => {
            if (event.userId === auth.user.id) return;
            setTypingUser({ id: event.userId, name: event.name });
            setTypingDots(true);
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setTypingDots(false), 3000);
        });

        return () => {
            (echo() as any).leave(`conversation.${conversationId}`);
        };
    }, [conversationId, auth.user.id]);

    // ── Send message ─────────────────────────────────────────────────────────
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
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
            setMessages((prev) => [...prev, json.message]);
            setInput('');
            setSelectedFile(null);
            setReplyingTo(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
        setSending(false);
    };

    // ── Delete message ───────────────────────────────────────────────────────
    const deleteMessage = async (msgId: number) => {
        if (!conversationId) return;
        // Optimistically remove
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        await fetch(`/messenger/${conversationId}/messages/${msgId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken() },
        });
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (!conversationId) return;
        (echo() as any).private(`conversation.${conversationId}`).whisper('typing', {
            userId: auth.user.id,
            name: auth.user.name,
        });
    };

    // ── Right offset (stack windows) ─────────────────────────────────────────
    // Base right position plus optional extra offset for the chat rail.
    const WINDOW_WIDTH = 320;
    const GAP = 12;
    const BASE_RIGHT = 20; // px from right edge of viewport
    const rightOffset = BASE_RIGHT + extraRight + index * (WINDOW_WIDTH + GAP);

    return (
        <div
            className="fixed z-50 flex flex-col overflow-hidden rounded-t-xl border border-zinc-200 shadow-2xl dark:border-zinc-700"
            style={{
                width: WINDOW_WIDTH,
                bottom: 0,
                right: rightOffset,
                height: chat.minimized ? 48 : 450,
                transition: 'height 0.2s ease',
            }}
        >
            {/* ── Header ── */}
            <button
                onClick={() => toggleMinimize(chat.chatId)}
                className={cn('flex h-12 shrink-0 cursor-pointer items-center gap-2 px-3 select-none', avatarColor(displayId))}
            >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    {chat.isGroup ? <Users className="h-4 w-4" /> : getInitials(displayName)}
                </div>
                <span className="flex-1 truncate text-sm font-semibold text-white">{displayName}</span>
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
            </button>

            {/* ── Body (hidden when minimized) ── */}
            {!chat.minimized && (
                <>
                    {/* Messages */}
                    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 space-y-1 overflow-y-auto bg-white px-3 py-2 dark:bg-zinc-900">
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
                                        <p className="text-xs text-zinc-400">{chat.isGroup ? 'No messages yet' : 'Start a conversation'}</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMe = msg.user.id === auth.user.id;
                                        const prevMsg = messages[i - 1];
                                        const showAvatar = !isMe && prevMsg?.user.id !== msg.user.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={cn('group relative flex items-end gap-1.5', isMe ? 'justify-end' : 'justify-start')}
                                                onMouseEnter={() => setHoveredMsgId(msg.id)}
                                                onMouseLeave={() => setHoveredMsgId(null)}
                                            >
                                                {!isMe && (
                                                    <div
                                                        className={cn(
                                                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                                                            showAvatar ? avatarColor(msg.user.id) : 'invisible',
                                                        )}
                                                    >
                                                        {getInitials(msg.user.name)}
                                                    </div>
                                                )}

                                                {/* Hover actions — left of own bubble */}
                                                {isMe && hoveredMsgId === msg.id && (
                                                    <div className="mb-0.5 flex items-center gap-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReplyingTo(msg);
                                                                inputRef.current?.focus();
                                                            }}
                                                            className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                                                            title="Reply"
                                                        >
                                                            <CornerUpLeft className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteMessage(msg.id)}
                                                            className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )}

                                                <div className={cn('flex max-w-[200px] flex-col', isMe && 'items-end')}>
                                                    {/* Reply quote */}
                                                    {msg.reply_to && (
                                                        <div
                                                            className={cn(
                                                                'mb-0.5 flex items-center gap-1 rounded-xl px-2 py-1 text-[11px]',
                                                                isMe
                                                                    ? 'bg-white/20 text-white'
                                                                    : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
                                                            )}
                                                        >
                                                            <CornerUpLeft className="h-3 w-3 shrink-0" />
                                                            <span className="font-semibold">{msg.reply_to.user.name}:</span>
                                                            <span className="truncate">{msg.reply_to.body ?? '📎'}</span>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={cn(
                                                            'rounded-2xl px-3 py-1.5 text-sm leading-snug break-words',
                                                            isMe
                                                                ? 'rounded-br-sm bg-blue-600 text-white'
                                                                : 'rounded-bl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
                                                        )}
                                                    >
                                                        {msg.file_path && msg.mime_type?.startsWith('image/') && (
                                                            <a href={`/storage/${msg.file_path}`} target="_blank" rel="noreferrer">
                                                                <img
                                                                    src={`/storage/${msg.file_path}`}
                                                                    alt={msg.file_name ?? 'image'}
                                                                    className="mb-1 max-w-full rounded-lg object-cover"
                                                                />
                                                            </a>
                                                        )}
                                                        {msg.file_path && !msg.mime_type?.startsWith('image/') && (
                                                            <a
                                                                href={`/storage/${msg.file_path}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={cn(
                                                                    'mb-1 flex items-center gap-1.5 underline',
                                                                    isMe ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400',
                                                                )}
                                                            >
                                                                <Paperclip className="h-3 w-3 shrink-0" />
                                                                <span className="truncate text-xs">{msg.file_name}</span>
                                                            </a>
                                                        )}
                                                        {msg.body && <span>{msg.body}</span>}
                                                        <div className="mt-0.5 text-[10px] opacity-70">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        {isMe && msg.seen_at && i === messages.length - 1 && (
                                                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                                                                <Eye className="h-3 w-3" />
                                                                Seen{' '}
                                                                {new Date(msg.seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Hover actions — right of others' bubbles */}
                                                {!isMe && hoveredMsgId === msg.id && (
                                                    <div className="mb-0.5 flex items-center gap-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReplyingTo(msg);
                                                                inputRef.current?.focus();
                                                            }}
                                                            className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                                                            title="Reply"
                                                        >
                                                            <CornerUpLeft className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                {typingDots && (
                                    <div className="flex items-end gap-1.5">
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

                    {/* Input */}
                    <form onSubmit={sendMessage} className="flex flex-col border-t bg-white dark:border-zinc-700 dark:bg-zinc-900">
                        {/* Reply bar */}
                        {replyingTo && (
                            <div className="flex items-center gap-2 border-b bg-zinc-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800/60">
                                <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                        {replyingTo.user.id === auth.user.id ? 'Yourself' : replyingTo.user.name}
                                    </p>
                                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{replyingTo.body ?? '📎 Attachment'}</p>
                                </div>
                                <button type="button" onClick={() => setReplyingTo(null)} className="shrink-0 text-zinc-400 hover:text-zinc-600">
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
                        <div className="flex items-center gap-2 px-3 py-2">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={handleTyping}
                                placeholder="Aa"
                                className="flex-1 rounded-full bg-zinc-100 px-3 py-1.5 text-sm outline-none placeholder:text-zinc-400 dark:bg-zinc-800 dark:text-zinc-100"
                                disabled={sending}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (input.trim() || selectedFile || replyingTo) sendMessage(e as unknown as React.FormEvent);
                                    }
                                }}
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
                </>
            )}
        </div>
    );
}
