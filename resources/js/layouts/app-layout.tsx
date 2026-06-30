import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
// import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { memo } from 'react';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

/**
 * Simplified layout — ChatProvider / ChatManager / Toaster have been
 * moved to the persistent layer in app.tsx so floating chat windows
 * survive Inertia page-to-page navigation without re-mounting.
 */
const LayoutContent = memo(function LayoutContent({ children, breadcrumbs, ...props }: AppLayoutProps) {
    return (
        <TooltipProvider>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppLayoutTemplate>
        </TooltipProvider>
    );
});

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    return <LayoutContent children={children} breadcrumbs={breadcrumbs} {...props} />;
};
