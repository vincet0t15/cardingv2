import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup } from '@/types';
import { Link } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavGroup[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    // Icon color mapping for better visual appeal
    const getIconColor = (href: string) => {
        const colorMap: Record<string, string> = {
            '/dashboard': 'text-blue-500',
            '/employees': 'text-emerald-500',
            '/suppliers': 'text-cyan-500',
            '/reports/employees-by-source-of-fund': 'text-indigo-500',
            '/payroll': 'text-violet-500',
            '/employee-deductions': 'text-amber-500',
            '/salaries': 'text-blue-600',
            '/peras': 'text-emerald-600',
            '/ratas': 'text-orange-500',
            '/hazard-pays': 'text-red-500',
            '/clothing-allowances': 'text-pink-500',
            '/general-funds': 'text-yellow-600',
            '/settings/offices': 'text-teal-500',
            '/settings/employment-statuses': 'text-green-500',
            // '/settings/deduction-types': 'text-purple-500',
            '/settings/document-types': 'text-sky-500',
            '/settings/claim-types': 'text-rose-500',
            '/settings/backup': 'text-slate-500',
            '/accounts': 'text-indigo-600',
            '/roles': 'text-blue-700',
            '/permissions': 'text-orange-600',
            '/audit-logs': 'text-gray-500',
        };

        const cleanHref = href.includes('?') ? href.split('?')[0] : href;
        return colorMap[cleanHref] || 'text-slate-500';
    };

    return (
        <div className="space-y-3">
            {items.map((group) => {
                // Get gradient colors for each section title
                const getSectionGradient = (title: string) => {
                    const gradientMap: Record<string, string> = {
                        General: 'from-blue-500 to-cyan-500',
                        Payroll: 'from-violet-500 to-purple-500',
                        Compensation: 'from-emerald-500 to-teal-500',
                        Funds: 'from-yellow-500 to-orange-500',
                        Settings: 'from-slate-500 to-gray-500',
                        'Super Admin': 'from-indigo-500 to-blue-600',
                        Compliance: 'from-rose-500 to-red-500',
                    };
                    return gradientMap[title] || 'from-slate-500 to-gray-500';
                };

                return (
                    <SidebarGroup key={group.title} className="px-2 py-0">
                        <SidebarGroupLabel className="px-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-200">{group.title}</span>
                            </div>
                        </SidebarGroupLabel>
                        <SidebarMenu className="ml-2 gap-1">
                            {group.children?.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={isCurrentUrl(item.href)} tooltip={{ children: item.title }} className="">
                                        <Link href={item.href} prefetch preserveState preserveScroll>
                                            {item.icon && <item.icon className={`h-4 w-4 ${getIconColor(item.href)}`} />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                );
            })}
        </div>
    );
}
