/**
 * Clear all messenger-related localStorage to ensure privacy on logout
 * Removes:
 * - Active conversation tracking
 * - Open floating chats list
 * - Individual floating chat message caches
 * - Message scroll positions
 */
export function clearMessengerCache(): void {
    try {
        // Clear main messenger keys
        localStorage.removeItem('messenger_active_conversation');
        localStorage.removeItem('open_chats');

        // Clear all floating chat message caches
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
            if (key.startsWith('floating_chat_messages_') || key.startsWith('messenger_scroll_')) {
                localStorage.removeItem(key);
            }
        });
    } catch (e) {
        // Silently ignore errors (e.g., localStorage not available)
        console.debug('Failed to clear messenger cache:', e);
    }
}
