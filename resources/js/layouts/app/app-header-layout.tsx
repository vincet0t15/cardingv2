import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { type BreadcrumbItem } from '@/types';

interface AppHeaderLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    userRoles?: string[];
}

export default function AppHeaderLayout({ children, breadcrumbs, userRoles }: AppHeaderLayoutProps) {
    return (
        <AppShell>
            <AppHeader breadcrumbs={breadcrumbs} userRoles={userRoles} />
            <AppContent>{children}</AppContent>
        </AppShell>
    );
}
