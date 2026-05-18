import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
// import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { ChatManager } from '@/components/messenger/chat-manager';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatProvider } from '@/contexts/chat-context';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { url } = usePage();
    const hideFloatingChat = useMemo(() => url.startsWith('/messenger/'), [url]);

    return (
        <ChatProvider>
            <TooltipProvider>
                <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                    {children}
                    <Toaster position="top-right" />
                </AppLayoutTemplate>
                <div className={hideFloatingChat ? 'hidden' : ''}>
                    <ChatManager />
                </div>
            </TooltipProvider>
        </ChatProvider>
    );
};
