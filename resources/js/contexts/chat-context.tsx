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
    closeChat: (chatId: string) => void;
    closeAllChats: () => void;
    toggleMinimize: (chatId: string) => void;
    focusChat: (chatId: string) => void;
    setConversation: (chatId: string, conversation: ChatConversation) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [openChats, setOpenChats] = useState<OpenChat[]>([]);

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
