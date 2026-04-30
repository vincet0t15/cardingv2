import { createContext, useCallback, useContext, useState } from 'react';

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
    user: ChatUser; // the other person (DM only)
    conversation: ChatConversation | null;
    minimized: boolean;
}

interface ChatContextType {
    openChats: OpenChat[];
    openChat: (user: ChatUser, conversation?: ChatConversation | null) => void;
    closeChat: (userId: number) => void;
    toggleMinimize: (userId: number) => void;
    setConversation: (userId: number, conversation: ChatConversation) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [openChats, setOpenChats] = useState<OpenChat[]>([]);

    const openChat = useCallback((user: ChatUser, conversation: ChatConversation | null = null) => {
        setOpenChats((prev) => {
            const exists = prev.find((c) => c.user.id === user.id);
            if (exists) {
                // Already open — just unminimize
                return prev.map((c) => (c.user.id === user.id ? { ...c, minimized: false } : c));
            }
            return [...prev, { user, conversation, minimized: false }];
        });
    }, []);

    const closeChat = useCallback((userId: number) => {
        setOpenChats((prev) => prev.filter((c) => c.user.id !== userId));
    }, []);

    const toggleMinimize = useCallback((userId: number) => {
        setOpenChats((prev) => prev.map((c) => (c.user.id === userId ? { ...c, minimized: !c.minimized } : c)));
    }, []);

    const setConversation = useCallback((userId: number, conversation: ChatConversation) => {
        setOpenChats((prev) => prev.map((c) => (c.user.id === userId ? { ...c, conversation } : c)));
    }, []);

    return <ChatContext.Provider value={{ openChats, openChat, closeChat, toggleMinimize, setConversation }}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
    return ctx;
}
