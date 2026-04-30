import { useChatContext } from '@/contexts/chat-context';
import { FloatingChat } from './floating-chat';

export function ChatManager() {
    const { openChats } = useChatContext();

    if (openChats.length === 0) return null;

    return (
        <>
            {openChats.map((chat, index) => (
                <FloatingChat key={chat.user.id} chat={chat} index={index} />
            ))}
        </>
    );
}
