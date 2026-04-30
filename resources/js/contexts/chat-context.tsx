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
    closeAllChats: () => void;
    toggleMinimize: (userId: number) => void;
    focusChat: (userId: number) => void;
    setConversation: (userId: number, conversation: ChatConversation) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [openChats, setOpenChats] = useState<OpenChat[]>([]);

    const openChat = useCallback((user: ChatUser, conversation: ChatConversation | null = null) => {
        setOpenChats((prev) => {
            const index = prev.findIndex((c) => c.user.id === user.id);
            if (index !== -1) {
                const target = { ...prev[index], minimized: false, conversation: conversation ?? prev[index].conversation };
                return [target, ...prev.filter((c) => c.user.id !== user.id)];
            }
            return [{ user, conversation, minimized: false }, ...prev];
        });
    }, []);

    const closeChat = useCallback((userId: number) => {
        setOpenChats((prev) => prev.filter((c) => c.user.id !== userId));
    }, []);

    const toggleMinimize = useCallback((userId: number) => {
        setOpenChats((prev) => prev.map((c) => (c.user.id === userId ? { ...c, minimized: !c.minimized } : c)));
    }, []);

    const closeAllChats = useCallback(() => {
        setOpenChats([]);
    }, []);

    const focusChat = useCallback((userId: number) => {
        setOpenChats((prev) => {
            const index = prev.findIndex((c) => c.user.id === userId);
            if (index === -1) return prev;
            const target = { ...prev[index], minimized: false };
            return [target, ...prev.filter((c) => c.user.id !== userId)];
        });
    }, []);

    const setConversation = useCallback((userId: number, conversation: ChatConversation) => {
        setOpenChats((prev) => prev.map((c) => (c.user.id === userId ? { ...c, conversation } : c)));
    }, []);

    return (
        <ChatContext.Provider
            value={{
                openChats,
                openChat,
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
