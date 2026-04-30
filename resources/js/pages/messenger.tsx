import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { Edit, MessageCircle, Search, Send, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type UserType = { id: number; name: string; username: string };
type MessageType = {
    id: number;
    body: string;
    created_at: string;
    user: Pick<UserType, 'id' | 'name'>;
};
type ConversationType = {
    id: number;
    name: string | null;
    is_group: boolean;
    participants: UserType[];
    latest_message: MessageType | null;
    unread_count: number;
    updated_at: string;
};
type OnlineUser = { id: number; name: string };

type Props = {
    conversations: ConversationType[];
    users: UserType[];
    activeConversation: ConversationType | null;
    messages: MessageType[];
};

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
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
        month: 'short',
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

function nameColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return NAME_COLORS[hash % NAME_COLORS.length];
}

export default function Messenger({ conversations, users, activeConversation, messages: initialMessages }: Props) {
    const { auth } = usePage().props as { auth: { user: UserType } };

    const [messages, setMessages] = useState<MessageType[]>(initialMessages);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
    const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
    const [search, setSearch] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatSearch, setNewChatSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');
    const [creatingChat, setCreatingChat] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync messages when active conversation changes
    useEffect(() => {
        setMessages(initialMessages);
    }, [activeConversation?.id, initialMessages]);

    // Scroll to bottom on conversation open
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        inputRef.current?.focus();
    }, [activeConversation?.id]);

    // Smooth scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // Presence channel — online users
    useEffect(() => {
        (echo() as any)
            .join('messenger')
            .here((members: OnlineUser[]) => setOnlineUserIds(members.map((m) => m.id)))
            .joining((member: OnlineUser) => setOnlineUserIds((prev) => [...prev, member.id]))
            .leaving((member: OnlineUser) => setOnlineUserIds((prev) => prev.filter((id) => id !== member.id)));

        return () => {
            (echo() as any).leave('messenger');
        };
    }, []);

    // Private conversation channel — messages + typing whispers
    useEffect(() => {
        if (!activeConversation) return;

        const ch = (echo() as any).private(`conversation.${activeConversation.id}`);

        ch.listen('ConversationMessageSent', (event: { message: MessageType }) => {
            setMessages((prev) => (prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]));
        });

        ch.listenForWhisper('typing', (event: { userId: number; name: string }) => {
            if (event.userId === auth.user.id) return;
            setTypingUsers((prev) => ({ ...prev, [event.userId]: event.name }));
            clearTimeout(typingTimers.current[event.userId]);
            typingTimers.current[event.userId] = setTimeout(() => {
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
    }, [activeConversation?.id]);

    // Mark as read when opening a conversation
    useEffect(() => {
        if (!activeConversation) return;
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        fetch(`/messenger/${activeConversation.id}/read`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': token ?? '' },
        });
    }, [activeConversation?.id]);

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (!activeConversation) return;
        (echo() as any).private(`conversation.${activeConversation.id}`).whisper('typing', {
            userId: auth.user.id,
            name: auth.user.name,
        });
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeConversation || sending) return;

        setSending(true);
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        const socketId = (echo() as any).socketId?.() ?? null;

        const response = await fetch(`/messenger/${activeConversation.id}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token ?? '',
                ...(socketId ? { 'X-Socket-ID': socketId } : {}),
            },
            body: JSON.stringify({ body: input.trim() }),
        });

        if (response.ok) {
            const json = await response.json();
            setMessages((prev) => [...prev, json.message]);
            setInput('');
            router.reload({ only: ['conversations'] });
        }

        setSending(false);
    };

    const createConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserIds.length || creatingChat) return;
        if (selectedUserIds.length > 1 && !groupName.trim()) return;

        setCreatingChat(true);
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

        const response = await fetch('/messenger/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token ?? '',
            },
            body: JSON.stringify({
                user_ids: selectedUserIds,
                is_group: selectedUserIds.length > 1,
                name: selectedUserIds.length > 1 ? groupName.trim() : undefined,
            }),
        });

        if (response.ok) {
            const { id } = await response.json();
            setShowNewChat(false);
            setSelectedUserIds([]);
            setGroupName('');
            setNewChatSearch('');
            router.visit(`/messenger/${id}`);
        }

        setCreatingChat(false);
    };

    const startDm = async (userId: number) => {
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        const response = await fetch('/messenger/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token ?? '',
            },
            body: JSON.stringify({ user_ids: [userId], is_group: false }),
        });
        if (response.ok) {
            const { id } = await response.json();
            router.visit(`/messenger/${id}`);
        }
    };

    const getConversationName = (conv: ConversationType) => {
        if (conv.is_group) return conv.name ?? 'Group Chat';
        return conv.participants.find((p) => p.id !== auth.user.id)?.name ?? 'Unknown';
    };

    const isOnline = (userId: number) => onlineUserIds.includes(userId);

    const mergedList = useMemo(() => {
        type Item =
            | { kind: 'group'; conv: ConversationType; sortKey: number }
            | { kind: 'dm'; user: UserType; conv: ConversationType | null; sortKey: number };

        const groups: Item[] = conversations
            .filter((c) => c.is_group)
            .map((conv) => ({ kind: 'group', conv, sortKey: new Date(conv.updated_at).getTime() }));

        const dms: Item[] = users.map((user) => {
            const conv = conversations.find((c) => !c.is_group && c.participants.some((p) => p.id === user.id)) ?? null;
            return { kind: 'dm', user, conv, sortKey: conv ? new Date(conv.updated_at).getTime() : -1 };
        });

        const withConv = [...groups, ...dms.filter((d) => d.sortKey !== -1)].sort((a, b) => b.sortKey - a.sortKey);
        const withoutConv = (dms.filter((d) => d.sortKey === -1) as Extract<Item, { kind: 'dm' }>[]).sort((a, b) =>
            a.user.name.localeCompare(b.user.name),
        );

        return [...withConv, ...withoutConv];
    }, [conversations, users]);

    const filteredList = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return mergedList;
        return mergedList.filter((item) => {
            const name = item.kind === 'group' ? (item.conv.name ?? 'Group Chat') : item.user.name;
            return name.toLowerCase().includes(q);
        });
    }, [mergedList, search]);

    const typingNames = Object.values(typingUsers);
    const otherParticipant = activeConversation?.participants.find((p) => p.id !== auth.user.id) ?? null;

    const breadcrumbs = [{ title: 'Messages', href: '/messenger' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messages" />

            <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
                {/* ── Left Panel: All Users / Chats ── */}
                <div className="border-sidebar-border/50 bg-background flex w-[300px] shrink-0 flex-col border-r dark:bg-slate-950">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <h2 className="text-xl font-bold tracking-tight">Chats</h2>
                        <button
                            onClick={() => setShowNewChat(true)}
                            title="New group"
                            className="bg-muted hover:bg-muted/80 flex h-8 w-8 items-center justify-center rounded-full transition"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-3 pb-2">
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search Messenger"
                                className="bg-muted/60 focus:bg-muted w-full rounded-full py-2 pr-4 pl-9 text-sm outline-none dark:bg-slate-800/60 dark:focus:bg-slate-800"
                            />
                        </div>
                    </div>

                    {/* Unified list */}
                    <div className="flex-1 overflow-y-auto px-2 py-1">
                        {filteredList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                                <MessageCircle className="text-muted-foreground/40 h-8 w-8" />
                                <p className="text-muted-foreground text-sm">No results</p>
                            </div>
                        ) : (
                            filteredList.map((item) => {
                                if (item.kind === 'group') {
                                    const conv = item.conv;
                                    const isActive = activeConversation?.id === conv.id;
                                    const unread = conv.unread_count;
                                    return (
                                        <button
                                            key={`group-${conv.id}`}
                                            onClick={() => router.visit(`/messenger/${conv.id}`, { preserveScroll: true })}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition',
                                                isActive
                                                    ? 'bg-blue-600/10 ring-1 ring-blue-600/15 dark:bg-blue-400/10 dark:ring-blue-400/20'
                                                    : 'hover:bg-muted/70 dark:hover:bg-slate-800/60',
                                            )}
                                        >
                                            <div className="relative shrink-0">
                                                <div
                                                    className={cn(
                                                        'flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white',
                                                        avatarColor(conv.id),
                                                    )}
                                                >
                                                    <Users className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between gap-1">
                                                    <span className={cn('truncate text-sm', unread > 0 ? 'font-bold' : 'font-semibold')}>
                                                        {conv.name ?? 'Group Chat'}
                                                    </span>
                                                    {conv.latest_message && (
                                                        <span className="text-muted-foreground shrink-0 text-[11px]">
                                                            {formatTime(conv.latest_message.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <p
                                                        className={cn(
                                                            'truncate text-xs',
                                                            unread > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {conv.latest_message
                                                            ? `${conv.latest_message.user.id === auth.user.id ? 'You: ' : `${conv.latest_message.user.name}: `}${conv.latest_message.body}`
                                                            : 'No messages yet'}
                                                    </p>
                                                    {unread > 0 && (
                                                        <span className="ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm dark:bg-blue-500">
                                                            {unread > 99 ? '99+' : unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }

                                // DM user row
                                const { user, conv } = item;
                                const isActive = conv ? activeConversation?.id === conv.id : false;
                                const unread = conv?.unread_count ?? 0;
                                const online = isOnline(user.id);
                                return (
                                    <button
                                        key={`user-${user.id}`}
                                        onClick={() => (conv ? router.visit(`/messenger/${conv.id}`, { preserveScroll: true }) : startDm(user.id))}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition',
                                            isActive
                                                ? 'bg-blue-600/10 ring-1 ring-blue-600/15 dark:bg-blue-400/10 dark:ring-blue-400/20'
                                                : 'hover:bg-muted/70 dark:hover:bg-slate-800/60',
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <div
                                                className={cn(
                                                    'flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white',
                                                    avatarColor(user.id),
                                                )}
                                            >
                                                {getInitials(user.name)}
                                            </div>
                                            <span
                                                className={cn(
                                                    'border-background absolute right-0.5 bottom-0.5 h-3.5 w-3.5 rounded-full border-2',
                                                    online ? 'bg-green-500' : 'bg-zinc-400',
                                                )}
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-1">
                                                <span className={cn('truncate text-sm', unread > 0 ? 'font-bold' : 'font-semibold')}>
                                                    {user.name}
                                                </span>
                                                {conv?.latest_message && (
                                                    <span className="text-muted-foreground shrink-0 text-[11px]">
                                                        {formatTime(conv.latest_message.created_at)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <p
                                                    className={cn(
                                                        'truncate text-xs',
                                                        unread > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground',
                                                    )}
                                                >
                                                    {conv?.latest_message
                                                        ? `${conv.latest_message.user.id === auth.user.id ? 'You: ' : ''}${conv.latest_message.body}`
                                                        : online
                                                          ? 'Active now'
                                                          : 'Say hi!'}
                                                </p>
                                                {unread > 0 && (
                                                    <span className="ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm dark:bg-blue-500">
                                                        {unread > 99 ? '99+' : unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Right Panel: Message Thread or Empty State ── */}
                {activeConversation ? (
                    <div className="flex flex-1 flex-col overflow-hidden">
                        {/* Conversation header */}
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
                                        getInitials(getConversationName(activeConversation))
                                    )}
                                </div>
                                {otherParticipant && isOnline(otherParticipant.id) && (
                                    <span className="border-background absolute right-0.5 bottom-0.5 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm leading-tight font-semibold">{getConversationName(activeConversation)}</p>
                                <p className="text-muted-foreground text-xs">
                                    {otherParticipant && isOnline(otherParticipant.id)
                                        ? 'Active now'
                                        : activeConversation.is_group
                                          ? `${activeConversation.participants.length} members`
                                          : 'Offline'}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            <div className="flex w-full flex-col gap-0.5">
                                {messages.length === 0 && (
                                    <div className="text-muted-foreground py-8 text-center text-sm">No messages yet. Say hi!</div>
                                )}
                                {messages.map((message, i) => {
                                    const isMine = message.user.id === auth.user.id;
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
                                                    'flex w-full items-end gap-1.5',
                                                    isMine ? 'justify-end' : 'justify-start',
                                                    !isLastInGroup && 'mb-0',
                                                    isLastInGroup && 'mb-1',
                                                )}
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

                                                <div
                                                    className={cn(
                                                        'flex max-w-[min(100%,20rem)] flex-col lg:max-w-sm xl:max-w-md',
                                                        isMine && 'items-end',
                                                    )}
                                                >
                                                    {showName && (
                                                        <span className={cn('mb-0.5 px-3 text-xs font-medium', nameColor(message.user.name))}>
                                                            {message.user.name}
                                                        </span>
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
                                                        {isLastInGroup && (
                                                            <p
                                                                className={cn(
                                                                    'mt-1 text-[10px] tabular-nums',
                                                                    isMine ? 'text-blue-100' : 'text-muted-foreground',
                                                                )}
                                                            >
                                                                {formatTime(message.created_at)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Typing indicator */}
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

                        {/* Message input */}
                        <div className="border-sidebar-border/50 border-t px-4 py-3">
                            <form onSubmit={sendMessage} className="flex items-center gap-2">
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
                                            sendMessage(e as unknown as React.FormEvent);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sending}
                                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b7ff5] text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-600 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* Empty state */
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20">
                            <MessageCircle className="h-10 w-10 text-sky-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">Your Messages</h3>
                            <p className="text-muted-foreground mt-1 text-sm">Send private messages to your colleagues</p>
                        </div>
                        <button
                            onClick={() => setShowNewChat(true)}
                            className="rounded-full bg-[#0b7ff5] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-600"
                        >
                            Send message
                        </button>
                    </div>
                )}
            </div>

            {/* ── New Conversation Modal ── */}
            {showNewChat && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={(e) => e.target === e.currentTarget && setShowNewChat(false)}
                >
                    <div className="bg-background w-full max-w-md rounded-2xl p-6 shadow-2xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">New Group</h3>
                            <button
                                onClick={() => {
                                    setShowNewChat(false);
                                    setSelectedUserIds([]);
                                    setGroupName('');
                                    setNewChatSearch('');
                                }}
                                className="text-muted-foreground hover:bg-muted rounded-full p-1.5 transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={createConversation}>
                            {selectedUserIds.length > 1 && (
                                <input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Group name (required)"
                                    required
                                    className="border-border mb-3 w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                                />
                            )}

                            <div className="relative mb-3">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                                <input
                                    value={newChatSearch}
                                    onChange={(e) => setNewChatSearch(e.target.value)}
                                    placeholder="Search people..."
                                    className="bg-muted/60 focus:bg-muted w-full rounded-full py-2 pr-4 pl-9 text-sm outline-none dark:bg-slate-800"
                                />
                            </div>

                            {selectedUserIds.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-1.5">
                                    {selectedUserIds.map((id) => {
                                        const u = users.find((x) => x.id === id);
                                        return u ? (
                                            <span
                                                key={id}
                                                className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                                            >
                                                {u.name}
                                                <button type="button" onClick={() => setSelectedUserIds((p) => p.filter((i) => i !== id))}>
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            )}

                            <div className="border-border max-h-52 overflow-y-auto rounded-xl border">
                                {users
                                    .filter((u) => !selectedUserIds.includes(u.id) && u.name.toLowerCase().includes(newChatSearch.toLowerCase()))
                                    .map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => setSelectedUserIds((p) => [...p, u.id])}
                                            className="hover:bg-muted/60 flex w-full items-center gap-3 px-3 py-2.5 text-left transition dark:hover:bg-slate-800/60"
                                        >
                                            <div className="relative shrink-0">
                                                <div
                                                    className={cn(
                                                        'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white',
                                                        avatarColor(u.id),
                                                    )}
                                                >
                                                    {getInitials(u.name)}
                                                </div>
                                                {isOnline(u.id) && (
                                                    <span className="border-background absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium">{u.name}</p>
                                                <p className="text-muted-foreground truncate text-xs">@{u.username}</p>
                                            </div>
                                        </button>
                                    ))}

                                {users.filter((u) => !selectedUserIds.includes(u.id) && u.name.toLowerCase().includes(newChatSearch.toLowerCase()))
                                    .length === 0 && <p className="text-muted-foreground py-6 text-center text-sm">No users found</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={!selectedUserIds.length || (selectedUserIds.length > 1 && !groupName.trim()) || creatingChat}
                                className="mt-4 w-full rounded-full bg-[#0b7ff5] py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-600 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {creatingChat ? 'Creating...' : selectedUserIds.length > 1 ? 'Create group' : 'Open chat'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
