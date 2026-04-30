import { useChatContext } from '@/contexts/chat-context';
import { useState } from 'react';
import { FloatingChat } from './floating-chat';

const WINDOW_WIDTH = 320;
const GAP = 12;
const BASE_RIGHT = 20;

export function ChatManager() {
    const { openChats, focusChat } = useChatContext();
    const [showHidden, setShowHidden] = useState(false);

    if (openChats.length === 0) return null;

    const visibleChats = openChats.slice(0, 3);
    const hiddenChats = openChats.slice(3);

    return (
        <>
            {visibleChats.map((chat, index) => (
                <FloatingChat key={chat.user.id} chat={chat} index={index} />
            ))}

            <div className="fixed right-4 bottom-24 z-50 flex flex-col items-center gap-3">
                <button
                    type="button"
                    onClick={() => setShowHidden((prev) => !prev)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition hover:bg-zinc-700"
                    title="More chats"
                >
                    <span className="text-2xl leading-none">…</span>
                </button>

                {visibleChats.map((chat) => (
                    <button
                        key={chat.user.id}
                        type="button"
                        onClick={() => focusChat(chat.user.id)}
                        className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-lg"
                        title={chat.user.name}
                    >
                        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 to-violet-600 text-sm font-bold text-white">
                            {chat.user.name
                                .split(' ')
                                .map((part) => part[0])
                                .join('')
                                .slice(0, 2)}
                        </span>
                    </button>
                ))}

                {hiddenChats.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowHidden((prev) => !prev)}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-white bg-white text-sm font-semibold text-zinc-900 shadow-lg transition hover:bg-zinc-100"
                        title={`${hiddenChats.length} hidden chats`}
                    >
                        +{hiddenChats.length}
                    </button>
                )}
            </div>

            {showHidden && hiddenChats.length > 0 && (
                <div className="fixed right-24 bottom-24 z-50 w-72 rounded-3xl border border-zinc-200 bg-white p-3 shadow-2xl dark:border-zinc-700 dark:bg-zinc-950">
                    <div className="mb-3 flex items-center justify-between rounded-2xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                        <span>Hidden chats</span>
                        <button
                            type="button"
                            onClick={() => setShowHidden(false)}
                            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                            ×
                        </button>
                    </div>
                    <div className="space-y-2">
                        {hiddenChats.map((chat) => (
                            <button
                                key={chat.user.id}
                                type="button"
                                onClick={() => {
                                    focusChat(chat.user.id);
                                    setShowHidden(false);
                                }}
                                className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 px-3 py-3 text-left transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-500 text-sm font-bold text-white">
                                    {chat.user.name
                                        .split(' ')
                                        .map((part) => part[0])
                                        .join('')
                                        .slice(0, 2)}
                                </div>
                                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{chat.user.name}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
