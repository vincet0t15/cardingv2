import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChatContext } from '@/contexts/chat-context';
import { X } from 'lucide-react';
import { useState } from 'react';
import { FloatingChat } from './floating-chat';

const WINDOW_WIDTH = 320;
const GAP = 12;
const BASE_RIGHT = 20;
const RAIL_WIDTH = 56;

export function ChatManager() {
    const { openChats, closeAllChats, focusChat, toggleMinimize } = useChatContext();
    const [showPopover, setShowPopover] = useState(false);

    if (openChats.length === 0) return null;

    const activeChats = openChats.filter((chat) => !chat.minimized);
    const minimizedChats = openChats.filter((chat) => chat.minimized);
    const visibleChats = activeChats.slice(0, 3);
    const hiddenChats = activeChats.slice(3);
    const sideItems = [...minimizedChats, ...hiddenChats];
    const railVisible = sideItems.length > 0;
    const extraRight = railVisible ? RAIL_WIDTH + GAP : 0;

    return (
        <>
            {visibleChats.map((chat, index) => (
                <FloatingChat key={chat.user.id} chat={chat} index={index} extraRight={extraRight} />
            ))}

            {railVisible && (
                <div className="fixed right-4 bottom-24 z-50 flex flex-col items-center gap-3">
                    <Popover open={showPopover} onOpenChange={setShowPopover}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition hover:bg-zinc-700"
                                title="More chats"
                            >
                                <span className="text-2xl leading-none">…</span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 rounded-3xl border border-zinc-200 bg-white p-3 shadow-2xl" align="start">
                            <div className="flex items-center justify-between rounded-2xl bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900">
                                <span>Close all chats</span>
                                <button type="button" onClick={() => setShowPopover(false)} className="text-zinc-500 hover:text-zinc-900">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    closeAllChats();
                                    setShowPopover(false);
                                }}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Close all chats
                            </button>
                        </PopoverContent>
                    </Popover>

                    {sideItems.map((chat) => (
                        <button
                            key={chat.user.id}
                            type="button"
                            onClick={() => (chat.minimized ? toggleMinimize(chat.user.id) : focusChat(chat.user.id))}
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
                </div>
            )}
        </>
    );
}
