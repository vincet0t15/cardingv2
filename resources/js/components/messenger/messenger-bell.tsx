import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChatContext } from '@/contexts/chat-context';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { Edit, Loader2, MessageCircle, Search, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UserType {
    id: number;
    name: string;
    username: string;
}

interface MessageType {
    id: number;
    body: string;
    created_at: string;
    user: { id: number; name: string };
}

interface ConversationType {
    id: number;
    name: string | null;
    is_group: boolean;
    participants: UserType[];
    latest_message: MessageType | null;
    unread_count: number;
    updated_at: string;
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

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function MessengerBell() {
    const { auth } = usePage().props as unknown as { auth: { user: UserType } };
    const { openChat, openGroupChat } = useChatContext();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState<ConversationType[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
    const [usersPage, setUsersPage] = useState(1);
    const [convPage, setConvPage] = useState(1);
    const [usersHasMore, setUsersHasMore] = useState(true);
    const [convHasMore, setConvHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const fetchRecent = async () => {
        try {
            const res = await fetch(route('messenger.recent'), {
                credentials: 'include',
            });
            if (!res.ok) return;
            const data = await res.json();
            setConversations(data.conversations);
            setUsers(data.users);
            setTotalUnread(data.total_unread);
        } catch {
            // silently fail
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecent();
        intervalRef.current = setInterval(fetchRecent, 30000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setConversations([]);
            setUsers([]);
            setUsersPage(1);
            setConvPage(1);
            setUsersHasMore(true);
            setConvHasMore(true);
            fetchInitialPages();
        }
    }, [isOpen]);

    const fetchInitialPages = useCallback(async () => {
        setIsLoading(true);
        try {
            const [convRes, userRes] = await Promise.all([
                fetch('/messenger/conversations?page=1'),
                fetch('/messenger/users?page=1'),
            ]);
            if (convRes.ok) {
                const data = await convRes.json();
                setConversations(data.conversations);
                setConvHasMore(data.has_more);
                setConvPage(data.has_more ? 2 : 1);
            }
            if (userRes.ok) {
                const data = await userRes.json();
                setUsers(data.users);
                setUsersHasMore(data.has_more);
                setUsersPage(data.has_more ? 2 : 1);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchMore = useCallback(async () => {
        if (loadingMore || (!usersHasMore && !convHasMore)) return;
        setLoadingMore(true);
        try {
            if (usersHasMore) {
                const res = await fetch(`/messenger/users?page=${usersPage}`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers((prev) => {
                        const existing = new Set(prev.map((u) => u.id));
                        const newUsers = data.users.filter((u: UserType) => !existing.has(u.id));
                        return [...prev, ...newUsers];
                    });
                    setUsersHasMore(data.has_more);
                    if (data.has_more) setUsersPage(usersPage + 1);
                }
            }
            if (convHasMore) {
                const res = await fetch(`/messenger/conversations?page=${convPage}`);
                if (res.ok) {
                    const data = await res.json();
                    setConversations((prev) => {
                        const existing = new Set(prev.map((c) => c.id));
                        const newConvs = data.conversations.filter((c: ConversationType) => !existing.has(c.id));
                        return [...prev, ...newConvs];
                    });
                    setConvHasMore(data.has_more);
                    if (data.has_more) setConvPage(convPage + 1);
                }
            }
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, usersHasMore, convHasMore, usersPage, convPage]);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && isOpen) {
                    fetchMore();
                }
            },
            { root: listRef.current, threshold: 0.1 },
        );

        const sentinel = document.getElementById('bell-list-sentinel');
        if (sentinel) observer.observe(sentinel);

        return () => observer.disconnect();
    }, [fetchMore, isLoading, isOpen]);

    useEffect(() => {
        type OnlineUser = { id: number; name: string };
        (echo() as any)
            .join('messenger')
            .here((members: OnlineUser[]) => setOnlineUserIds(members.map((m) => m.id)))
            .joining((member: OnlineUser) => setOnlineUserIds((prev) => [...prev, member.id]))
            .leaving((member: OnlineUser) => setOnlineUserIds((prev) => prev.filter((id) => id !== member.id)));
        return () => {
            (echo() as any).leave('messenger');
        };
    }, []);

    const getConversationName = (conv: ConversationType) => {
        if (conv.is_group) return conv.name ?? 'Group Chat';
        return conv.participants.find((p) => p.id !== auth.user.id)?.name ?? 'Unknown';
    };

    // Build merged list: groups + DM users (with or without existing conversation)
    type ListItem =
        | { kind: 'group'; conv: ConversationType; sortKey: number }
        | { kind: 'dm'; user: UserType; conv: ConversationType | null; sortKey: number };

    const mergedList = useMemo<ListItem[]>(() => {
        const groups: ListItem[] = conversations
            .filter((c) => c.is_group)
            .map((conv) => ({ kind: 'group', conv, sortKey: new Date(conv.updated_at).getTime() }));

        const dms: ListItem[] = users.map((user) => {
            const conv = conversations.find((c) => !c.is_group && c.participants.some((p) => p.id === user.id)) ?? null;
            return { kind: 'dm', user, conv, sortKey: conv ? new Date(conv.updated_at).getTime() : -1 };
        });

        const withConv = [...groups, ...dms.filter((d) => d.sortKey !== -1)].sort((a, b) => b.sortKey - a.sortKey);
        const withoutConv = (dms.filter((d) => d.sortKey === -1) as Extract<ListItem, { kind: 'dm' }>[]).sort((a, b) =>
            a.user.name.localeCompare(b.user.name),
        );

        return [...withConv, ...withoutConv];
    }, [conversations, users, auth.user.id]);

    const filteredList = useMemo(() => {
        return mergedList.filter((item) => {
            const name = item.kind === 'group' ? (item.conv.name ?? 'Group Chat') : item.user.name;

            if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;

            if (filter === 'unread') {
                const unread = item.kind === 'group' ? item.conv.unread_count : (item.conv?.unread_count ?? 0);
                return unread > 0;
            }
            if (filter === 'groups') return item.kind === 'group';

            return true;
        });
    }, [mergedList, search, filter]);

    const openDm = (user: UserType, conv: ConversationType | null) => {
        setIsOpen(false);
        openChat(user, conv);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10" title="Messages">
                    <MessageCircle className="h-5 w-5" />
                    {totalUnread > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs font-bold"
                        >
                            {totalUnread > 99 ? '99+' : totalUnread}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[360px] p-0" align="end">
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <h3 className="text-xl font-bold">Chats</h3>
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            router.visit('/messenger');
                        }}
                        className="bg-muted hover:bg-muted/80 flex h-8 w-8 items-center justify-center rounded-full transition"
                        title="Open Messenger"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 pb-2">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search Messenger"
                            className="bg-muted/70 focus:bg-muted dark:bg-muted/40 w-full rounded-full py-2 pr-4 pl-9 text-sm outline-none"
                        />
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 px-4 pb-2">
                    {(['all', 'unread', 'groups'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={cn(
                                'rounded-full px-3 py-1 text-sm font-medium capitalize transition',
                                filter === tab
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'text-muted-foreground hover:bg-muted',
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div ref={listRef} className="max-h-[420px] overflow-y-auto pb-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : filteredList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                            <MessageCircle className="text-muted-foreground/40 h-8 w-8" />
                            <p className="text-muted-foreground text-sm">
                                {filter !== 'all' ? `No ${filter} chats` : search ? 'No results' : 'No users yet'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {filteredList.map((item) => {
                                if (item.kind === 'group') {
                                    const { conv } = item;
                                    const unread = conv.unread_count;
                                    return (
                                        <button
                                            key={`group-${conv.id}`}
                                            onClick={() => {
                                                setIsOpen(false);
                                                openGroupChat(conv);
                                            }}
                                            className="hover:bg-muted/60 dark:hover:bg-muted/20 flex w-full items-center gap-3 px-4 py-2.5 text-left transition"
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
                                                        <span
                                                            className={cn(
                                                                'shrink-0 text-[11px]',
                                                                unread > 0 ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
                                                            )}
                                                        >
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
                                                        <span className="ml-auto flex h-4 min-w-[1rem] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white dark:bg-blue-500">
                                                            {unread > 99 ? '99+' : unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }

                                // DM row
                                const { user, conv } = item;
                                const unread = conv?.unread_count ?? 0;
                                return (
                                    <button
                                        key={`user-${user.id}`}
                                        onClick={() => openDm(user, conv)}
                                        className="hover:bg-muted/60 dark:hover:bg-muted/20 flex w-full items-center gap-3 px-4 py-2.5 text-left transition"
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
                                                    'border-background absolute right-0.5 bottom-0.5 h-3 w-3 rounded-full border-2',
                                                    onlineUserIds.includes(user.id) ? 'bg-green-500' : 'bg-zinc-400',
                                                )}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-1">
                                                <span className={cn('truncate text-sm', unread > 0 ? 'font-bold' : 'font-semibold')}>{user.name}</span>
                                                {conv?.latest_message && (
                                                    <span
                                                        className={cn(
                                                            'shrink-0 text-[11px]',
                                                            unread > 0 ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
                                                        )}
                                                    >
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
                                                        : 'Say hi!'}
                                                </p>
                                                {unread > 0 && (
                                                    <span className="ml-auto flex h-4 min-w-[1rem] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white dark:bg-blue-500">
                                                        {unread > 99 ? '99+' : unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {loadingMore && (
                                <div className="flex items-center justify-center py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}

                            <div id="bell-list-sentinel" className="h-1" />
                        </>
                    )}
                </div>

                {/* Footer */}
                <button
                    onClick={() => {
                        setIsOpen(false);
                        router.visit('/messenger');
                    }}
                    className="hover:bg-muted/50 w-full border-t py-2.5 text-center text-sm font-medium text-blue-600 transition dark:text-blue-400"
                >
                    See all in Messenger
                </button>
            </PopoverContent>
        </Popover>
    );
}
