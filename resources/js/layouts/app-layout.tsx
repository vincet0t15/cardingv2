import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
// import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { ChatManager } from '@/components/messenger/chat-manager';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatProvider } from '@/contexts/chat-context';
import { usePage } from '@inertiajs/react';
import { memo, useMemo } from 'react';
interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

/**
 * Inner layout that does NOT depend on ChatContext — memoized so it won't
 * re-render when chat state changes (e.g. incoming message). This prevents
 * form data loss on pages the user is actively filling out.
 */
const LayoutContent = memo(function LayoutContent({
    children,
    breadcrumbs,
    hideFloatingChat,
    ...props
}: AppLayoutProps & { hideFloatingChat: boolean }) {
    return (
        <TooltipProvider>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
                <Toaster position="top-right" />
            </AppLayoutTemplate>
            <div className={hideFloatingChat ? 'hidden' : ''}>
                <ChatManager />
            </div>
        </TooltipProvider>
    );
});

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { url } = usePage();
    const hideFloatingChat = useMemo(() => url.startsWith('/messenger/'), [url]);

    return (
        <ChatProvider>
            <LayoutContent children={children} breadcrumbs={breadcrumbs} hideFloatingChat={hideFloatingChat} {...props} />
        </ChatProvider>
    );
};
