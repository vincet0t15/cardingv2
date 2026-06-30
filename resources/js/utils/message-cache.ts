/**
 * Module-level message cache for floating chats.
 *
 * Messages are stored here to survive Inertia page navigations (component
 * unmount/remount cycles) WITHOUT triggering broad React context re-renders
 * that could interfere with page-level forms and inputs.
 *
 * Each FloatingChat reads from and writes to this cache directly, using
 * local useState only for reactivity within the component instance.
 */

export interface CachedMessage {
    id: number;
    body: string | null;
    reply_to_id: number | null;
    reply_to: { id: number; body: string | null; user: { id: number; name: string } } | null;
    file_name: string | null;
    file_path: string | null;
    file_type: string | null;
    file_size: number | null;
    mime_type: string | null;
    created_at: string;
    seen_at: string | null;
    seen_by: number | null;
    user: { id: number; name: string };
}

const messageCache: Record<string, CachedMessage[]> = {};

export function getCachedMessages(chatId: string): CachedMessage[] {
    return messageCache[chatId] ?? [];
}

export function setCachedMessages(chatId: string, messages: CachedMessage[]): void {
    messageCache[chatId] = messages;
}

export function hasCachedMessages(chatId: string): boolean {
    return chatId in messageCache && messageCache[chatId].length > 0;
}

export function appendCachedMessage(chatId: string, message: CachedMessage): void {
    if (!messageCache[chatId]) {
        messageCache[chatId] = [];
    }
    // Avoid duplicates
    if (!messageCache[chatId].some((m) => m.id === message.id)) {
        messageCache[chatId] = [...messageCache[chatId], message];
    }
}

export function removeCachedMessage(chatId: string, messageId: number): void {
    if (messageCache[chatId]) {
        messageCache[chatId] = messageCache[chatId].filter((m) => m.id !== messageId);
    }
}

export function prependCachedMessages(chatId: string, messages: CachedMessage[]): void {
    const existing = messageCache[chatId] ?? [];
    const existingIds = new Set(existing.map((m) => m.id));
    const newMessages = messages.filter((m) => !existingIds.has(m.id));
    if (newMessages.length > 0) {
        messageCache[chatId] = [...newMessages, ...existing];
    }
}

export function clearChatCache(chatId: string): void {
    delete messageCache[chatId];
}
