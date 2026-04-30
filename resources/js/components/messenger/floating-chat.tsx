import { type OpenChat, useChatContext } from '@/contexts/chat-context';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { Minus, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MessageType {
    id: number;
    body: string;
    created_at: string;
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
}

export function FloatingChat({ chat, index }: Props) {
    const { auth } = usePage().props as { auth: { user: { id: number; name: string } } };
    const { closeChat, toggleMinimize, setConversation } = useChatContext();

    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [conversationId, setConversationId] = useState<number | null>(chat.conversation?.id ?? null);
    const [typingDots, setTypingDots] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Step 1: resolve conversation (create if needed) ──────────────────────
    useEffect(() => {
        if (chat.minimized) return;

        const init = async () => {
            let convId = conversationId;

            if (!convId) {
                // Create a DM conversation
                const res = await fetch('/messenger/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                    body: JSON.stringify({ user_ids: [chat.user.id], is_group: false }),
                });
                if (!res.ok) {
                    setLoading(false);
                    return;
                }
                const { id } = await res.json();
                convId = id;
                setConversationId(id);
                setConversation(chat.user.id, {
                    id,
                    name: null,
                    is_group: false,
                    participants: [chat.user],
                });
            }

            // Load messages
            const res = await fetch(`/messenger/${convId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
            setLoading(false);
        };

        init();
        // Only run when the chat opens/conversation initializes; not on every minimized change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chat.user.id]);

    // ── Step 2: scroll to bottom when opened / new messages ─────────────────
    useEffect(() => {
        if (!chat.minimized) {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' });
            inputRef.current?.focus();
        }
    }, [chat.minimized, messages.length]);

    // ── Step 3: WebSocket subscription ──────────────────────────────────────
    useEffect(() => {
        if (!conversationId) return;

        const ch = (echo() as any).private(`conversation.${conversationId}`);

        ch.listen('ConversationMessageSent', (event: { message: MessageType }) => {
            setMessages((prev) => (prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]));
        });

        ch.listenForWhisper('typing', (event: { userId: number }) => {
            if (event.userId === auth.user.id) return;
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
        if (!input.trim() || !conversationId || sending) return;

        setSending(true);
        const socketId = (echo() as any).socketId?.() ?? null;

        const res = await fetch(`/messenger/${conversationId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                ...(socketId ? { 'X-Socket-ID': socketId } : {}),
            },
            body: JSON.stringify({ body: input.trim() }),
        });

        if (res.ok) {
            const json = await res.json();
            setMessages((prev) => [...prev, json.message]);
            setInput('');
        }
        setSending(false);
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
    // Right sidebar is ~256px; keep clear of it. Each window is 320px + 12px gap.
    const WINDOW_WIDTH = 320;
    const GAP = 12;
    const BASE_RIGHT = 20; // px from right edge of viewport
    const rightOffset = BASE_RIGHT + index * (WINDOW_WIDTH + GAP);

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
                onClick={() => toggleMinimize(chat.user.id)}
                className={cn('flex h-12 shrink-0 cursor-pointer items-center gap-2 px-3 select-none', avatarColor(chat.user.id))}
            >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    {getInitials(chat.user.name)}
                </div>
                <span className="flex-1 truncate text-sm font-semibold text-white">{chat.user.name}</span>
                <span
                    role="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMinimize(chat.user.id);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-white/20"
                >
                    <Minus className="h-3.5 w-3.5" />
                </span>
                <span
                    role="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        closeChat(chat.user.id);
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
                    <div className="flex-1 space-y-1 overflow-y-auto bg-white px-3 py-2 dark:bg-zinc-900">
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                                <div
                                    className={cn(
                                        'flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white',
                                        avatarColor(chat.user.id),
                                    )}
                                >
                                    {getInitials(chat.user.name)}
                                </div>
                                <p className="mt-2 text-sm font-semibold">{chat.user.name}</p>
                                <p className="text-xs text-zinc-400">Start a conversation</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const isMe = msg.user.id === auth.user.id;
                                const prevMsg = messages[i - 1];
                                const showAvatar = !isMe && prevMsg?.user.id !== msg.user.id;
                                return (
                                    <div key={msg.id} className={cn('flex items-end gap-1.5', isMe ? 'justify-end' : 'justify-start')}>
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
                                        <div
                                            className={cn(
                                                'max-w-[200px] rounded-2xl px-3 py-1.5 text-sm leading-snug break-words',
                                                isMe
                                                    ? 'rounded-br-sm bg-blue-600 text-white'
                                                    : 'rounded-bl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
                                            )}
                                        >
                                            {msg.body}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {typingDots && (
                            <div className="flex items-end gap-1.5">
                                <div
                                    className={cn(
                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                                        avatarColor(chat.user.id),
                                    )}
                                >
                                    {getInitials(chat.user.name)}
                                </div>
                                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={sendMessage}
                        className="flex items-center gap-2 border-t bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                    >
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={handleTyping}
                            placeholder="Aa"
                            className="flex-1 rounded-full bg-zinc-100 px-3 py-1.5 text-sm outline-none placeholder:text-zinc-400 dark:bg-zinc-800 dark:text-zinc-100"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || sending}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
