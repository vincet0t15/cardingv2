/**
 * GlobalMessageListener
 *
 * Subscribes to every conversation channel the current user belongs to (except
 * ones already handled by an open FloatingChat window). When a message from
 * another user arrives it calls openChatForIncoming, which:
 *  – opens the chat normally if fewer than 3 active windows are showing, or
 *  – opens it minimised (side-rail) when the 3-window cap is already reached.
 */
import { useChatContext } from '@/contexts/chat-context';
import { usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ParticipantType {
    id: number;
    name: string;
    username: string;
}

interface ConversationType {
    id: number;
    name: string | null;
    is_group: boolean;
    participants: ParticipantType[];
}

interface AuthUser {
    id: number;
    name: string;
}

export function GlobalMessageListener() {
    const { openChats, openChatForIncoming } = useChatContext();
    const { auth } = usePage().props as unknown as { auth: { user: AuthUser } };
    const [conversations, setConversations] = useState<ConversationType[]>([]);
    const fetchedRef = useRef(false);

    // Fetch all user conversations once on mount; refresh every 60 s so newly
    // created conversations are picked up without a full page reload.
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await fetch(route('messenger.recent'), { credentials: 'include' });
                if (!res.ok) return;
                const data = await res.json();
                setConversations((data.conversations ?? []) as ConversationType[]);
                fetchedRef.current = true;
            } catch {
                // silently fail
            }
        };

        fetchAll();
        const id = setInterval(fetchAll, 60_000);
        return () => clearInterval(id);
    }, []);

    // IDs of conversations that already have an open FloatingChat window.
    // Those components subscribe to their own channel, so we skip them here
    // to avoid double-subscription teardown issues.
    const openConvIds = useMemo(() => new Set(openChats.map((c) => c.conversation?.id).filter((id): id is number => id != null)), [openChats]);

    useEffect(() => {
        if (!conversations.length) return;

        const toWatch = conversations.filter((c) => !openConvIds.has(c.id));

        const cleanups = toWatch.map((conv) => {
            const channelName = `conversation.${conv.id}`;
            const ch = (echo() as any).private(channelName);

            ch.listen('ConversationMessageSent', (event: { message: { user: { id: number } } }) => {
                // Ignore own messages
                if (event.message.user.id === auth.user.id) return;
                openChatForIncoming(conv, auth.user.id);
            });

            return () => (echo() as any).leave(channelName);
        });

        return () => cleanups.forEach((fn) => fn());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversations, openConvIds]);

    return null;
}
