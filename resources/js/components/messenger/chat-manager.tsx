import { useChatContext } from '@/contexts/chat-context';
import { useState } from 'react';
import { FloatingChat } from './floating-chat';

const WINDOW_WIDTH = 320;
const GAP = 12;
const BASE_RIGHT = 20;

export function ChatManager() {
    const { openChats, focusChat } = useChatContext();
    const [showMore, setShowMore] = useState(false);

    if (openChats.length === 0) return null;

    const hasOverflow = openChats.length > 3;
    const visibleChats = hasOverflow ? openChats.slice(0, 2) : openChats;
    const hiddenChats = hasOverflow ? openChats.slice(2) : [];
    const moreIndex = visibleChats.length;

    return (
        <>
            {visibleChats.map((chat, index) => (
                <FloatingChat key={chat.user.id} chat={chat} index={index} />
            ))}

            {hasOverflow && (
                <div
                    className="fixed z-50 flex h-[450px] w-[320px] flex-col overflow-hidden rounded-t-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
                    style={{ right: BASE_RIGHT + moreIndex * (WINDOW_WIDTH + GAP), bottom: 0 }}
                >
                    <button
                        type="button"
                        onClick={() => setShowMore((prev) => !prev)}
                        className="flex h-12 items-center justify-between gap-3 border-b px-4 text-sm font-semibold transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                        <span>+{hiddenChats.length} more chats</span>
                        <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                            {hiddenChats.length}
                        </span>
                    </button>

                    <div className="flex-1 overflow-y-auto p-3">
                        {showMore ? (
                            hiddenChats.map((chat) => (
                                <button
                                    key={chat.user.id}
                                    type="button"
                                    onClick={() => {
                                        focusChat(chat.user.id);
                                        setShowMore(false);
                                    }}
                                    className="mb-2 flex w-full items-center justify-between rounded-2xl border border-zinc-200 px-3 py-3 text-left text-sm transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                                >
                                    <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">{chat.user.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className="flex h-full items-center justify-center px-3 text-sm text-zinc-500 dark:text-zinc-400">
                                Click to see hidden chats
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
