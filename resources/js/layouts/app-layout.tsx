import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
// import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { ChatManager } from '@/components/messenger/chat-manager';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatProvider } from '@/contexts/chat-context';
interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <ChatProvider>
        <TooltipProvider>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
                <Toaster position="top-right" />
            </AppLayoutTemplate>
            <ChatManager />
        </TooltipProvider>
    </ChatProvider>
);
