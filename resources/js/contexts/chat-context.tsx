import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface ChatUser {
    id: number;
    name: string;
    username: string;
}

export interface ChatConversation {
    id: number;
    name: string | null;
    is_group: boolean;
    participants: ChatUser[];
}

export interface OpenChat {
    chatId: string; // stable key: "user-{id}" or "group-{convId}"
    isGroup: boolean;
    user: ChatUser | null; // null for group chats
    conversation: ChatConversation | null;
    minimized: boolean;
}

interface ChatContextType {
    openChats: OpenChat[];
    openChat: (user: ChatUser, conversation?: ChatConversation | null) => void;
    openGroupChat: (conversation: ChatConversation) => void;
    openChatForIncoming: (conversation: ChatConversation, currentUserId: number) => void;
    closeChat: (chatId: string) => void;
    closeAllChats: () => void;
    toggleMinimize: (chatId: string) => void;
    focusChat: (chatId: string) => void;
    setConversation: (chatId: string, conversation: ChatConversation) => void;
}

const STORAGE_KEY = 'open_chats';

function loadFromStorage(): OpenChat[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as OpenChat[];
    } catch {
        return [];
    }
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [openChats, setOpenChats] = useState<OpenChat[]>(() => loadFromStorage());

    // Persist to localStorage on every change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(openChats));
        } catch {
            // storage full or unavailable — ignore
        }
    }, [openChats]);

    const openChat = useCallback((user: ChatUser, conversation: ChatConversation | null = null) => {
        const chatId = `user-${user.id}`;
        setOpenChats((prev) => {
            const index = prev.findIndex((c) => c.chatId === chatId);
            if (index !== -1) {
                const target = { ...prev[index], minimized: false, conversation: conversation ?? prev[index].conversation };
                return [target, ...prev.filter((c) => c.chatId !== chatId)];
            }
            return [{ chatId, isGroup: false, user, conversation, minimized: false }, ...prev];
        });
    }, []);

    const openGroupChat = useCallback((conversation: ChatConversation) => {
        const chatId = `group-${conversation.id}`;
        setOpenChats((prev) => {
            const index = prev.findIndex((c) => c.chatId === chatId);
            if (index !== -1) {
                const target = { ...prev[index], minimized: false };
                return [target, ...prev.filter((c) => c.chatId !== chatId)];
            }
            return [{ chatId, isGroup: true, user: null, conversation, minimized: false }, ...prev];
        });
    }, []);

    const openChatForIncoming = useCallback((conversation: ChatConversation, currentUserId: number) => {
        let chatId: string;
        let isGroup: boolean;
        let user: ChatUser | null = null;

        if (conversation.is_group) {
            chatId = `group-${conversation.id}`;
            isGroup = true;
        } else {
            const otherUser = conversation.participants.find((p) => p.id !== currentUserId);
            if (!otherUser) return;
            chatId = `user-${otherUser.id}`;
            isGroup = false;
            user = otherUser;
        }

        setOpenChats((prev) => {
            // Already open (active or minimized in rail) — don't change anything
            if (prev.some((c) => c.chatId === chatId)) return prev;
            // Cap at 3 active windows; beyond that, minimise (goes to side rail)
            const activeCount = prev.filter((c) => !c.minimized).length;
            const minimized = activeCount >= 3;
            return [...prev, { chatId, isGroup, user, conversation, minimized }];
        });
    }, []);

    const closeChat = useCallback((chatId: string) => {
        setOpenChats((prev) => prev.filter((c) => c.chatId !== chatId));
    }, []);

    const toggleMinimize = useCallback((chatId: string) => {
        setOpenChats((prev) => prev.map((c) => (c.chatId === chatId ? { ...c, minimized: !c.minimized } : c)));
    }, []);

    const closeAllChats = useCallback(() => {
        setOpenChats([]);
    }, []);

    const focusChat = useCallback((chatId: string) => {
        setOpenChats((prev) => {
            const index = prev.findIndex((c) => c.chatId === chatId);
            if (index === -1) return prev;
            const target = { ...prev[index], minimized: false };
            return [target, ...prev.filter((c) => c.chatId !== chatId)];
        });
    }, []);

    const setConversation = useCallback((chatId: string, conversation: ChatConversation) => {
        setOpenChats((prev) => prev.map((c) => (c.chatId === chatId ? { ...c, conversation } : c)));
    }, []);

    return (
        <ChatContext.Provider
            value={{
                openChats,
                openChat,
                openGroupChat,
                openChatForIncoming,
                closeChat,
                closeAllChats,
                toggleMinimize,
                focusChat,
                setConversation,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
    return ctx;
}
