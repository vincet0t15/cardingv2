import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';

import {
    Banknote,
    BarChart3,
    Bot,
    Building2,
    Calculator,
    CoinsIcon,
    Database,
    DollarSign,
    FileText,
    HardHat,
    Key,
    LayoutGrid,
    LucideMoveVertical,
    Receipt,
    ReceiptCent,
    RefreshCcw,
    Settings,
    Shield,
    Shirt,
    Tag,
    Truck,
    User,
    UserCheck,
    UserRoundPen,
    Wallet,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavGroup[] = [
    {
        title: 'General',
        icon: Calculator,
        children: [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Employees',
                href: '/employees',
                icon: UserRoundPen,
            },
            {
                title: 'Suppliers',
                href: '/suppliers',
                icon: Truck,
            },
            {
                title: 'Employee List by Source of Fund',
                href: '/reports/employees-by-source-of-fund',
                icon: Receipt,
            },
            {
                title: 'AI Assistant',
                href: '/ai',
                icon: Bot,
            },
        ],
    },

    {
        title: 'Payroll',
        icon: Calculator,
        children: [
            {
                title: 'Payroll Summary',
                href: '/payroll',
                icon: Wallet,
            },
            {
                title: 'Employee Deductions',
                href: '/employee-deductions',
                icon: Receipt,
            },
        ],
    },
    {
        title: 'Compensation',
        icon: DollarSign,
        children: [
            {
                title: 'Salaries',
                href: '/salaries',
                icon: Banknote,
            },
            {
                title: 'PERA',
                href: '/peras',
                icon: DollarSign,
            },
            {
                title: 'RATA',
                href: '/ratas',
                icon: Calculator,
            },
            {
                title: 'Hazard Pay',
                href: '/hazard-pays',
                icon: HardHat,
            },
            {
                title: 'Clothing Allowance',
                href: '/clothing-allowances',
                icon: Shirt,
            },
        ],
    },
    {
        title: 'Funds',
        icon: CoinsIcon,
        children: [
            {
                title: 'General Funds',
                href: '/general-funds',
                icon: CoinsIcon,
            },
        ],
    },
    {
        title: 'Settings',
        icon: Settings,
        children: [
            {
                title: 'Offices',
                href: '/settings/offices',
                icon: Building2,
            },
            {
                title: 'Employment Statuses',
                href: '/settings/employment-statuses',
                icon: UserRoundPen,
            },
            {
                title: 'Deduction Categories',
                href: '/settings/deduction-categories',
                icon: Tag,
            },
            {
                title: 'Document Types',
                href: '/settings/document-types',
                icon: LucideMoveVertical,
            },
            {
                title: 'Claim Types',
                href: '/settings/claim-types',
                icon: ReceiptCent,
            },
            {
                title: 'Adjustment Types',
                href: '/settings/adjustment-types',
                icon: RefreshCcw,
            },
            {
                title: 'Reference Types',
                href: '/settings/reference-types',
                icon: Tag,
            },
            {
                title: 'Database Backup',
                href: '/settings/backup',
                icon: Database,
            },
        ],
    },
    {
        title: 'Super Admin',
        icon: Shield,
        children: [
            {
                title: 'Accounts',
                href: '/accounts',
                icon: UserCheck,
            },
            {
                title: 'Roles',
                href: '/roles',
                icon: Shield,
            },
            {
                title: 'Permissions',
                href: '/permissions',
                icon: Key,
            },
            {
                title: 'AI Settings',
                href: '/ai/settings',
                icon: Bot,
            },
        ],
    },
    {
        title: 'Compliance',
        icon: FileText,
        children: [
            {
                title: 'Audit Logs',
                href: '/audit-logs',
                icon: FileText,
            },
            {
                title: 'Performance Metrics',
                href: '/audit-logs/performance',
                icon: BarChart3,
            },
        ],
    },
];

const employeeNavItems: NavGroup[] = [
    {
        title: 'My Portal',
        icon: UserRoundPen,
        children: [
            {
                title: 'Dashboard',
                href: '/employee/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'My Payslip',
                href: '/my/payslip',
                icon: ReceiptCent,
            },
            {
                title: 'My Claims',
                href: '/my/claims',
                icon: FileText,
            },
            {
                title: 'My Profile',
                href: '/my/profile/edit',
                icon: User,
            },
        ],
    },
];

export function AppSidebar() {
    const pageProps = usePage().props as {
        auth?: { user?: { is_employee?: boolean; is_admin?: boolean; should_use_employee_portal?: boolean; permissions?: string[] } | null };
        performanceMetrics?: Array<{
            user_id: number;
            user_name: string;
            created_count: number;
            updated_count: number;
            deleted_count: number;
            total_actions: number;
        }>;
    };
    const authUser = pageProps.auth?.user;
    const userPermissions = authUser?.permissions ?? [];

    // Use the backend's unified decision: should this user see the employee portal?
    const isEmployeeOnly = authUser?.should_use_employee_portal === true;

    // Filter nav items based on permissions
    const filterByPermission = (items: NavGroup[]): NavGroup[] => {
        if (!isEmployeeOnly) {
            return items.map(group => ({
                ...group,
                children: (group.children || []).filter(child => {
                    // Hide Super Admin section items if user lacks permissions
                    if (child.href === '/accounts' && !userPermissions.includes('accounts.manage')) return false;
                    if (child.href === '/roles' && !userPermissions.includes('roles.manage')) return false;
                    if (child.href === '/permissions' && !userPermissions.includes('permissions.manage')) return false;
                    if (child.href === '/ai/settings' && !userPermissions.includes('ai_settings.manage')) return false;
                    return true;
                }),
            })).filter(group => (group.children || []).length > 0);
        }
        return items;
    };

    const navItems = filterByPermission(isEmployeeOnly ? employeeNavItems : mainNavItems);
    const dashboardHref = isEmployeeOnly ? '/employee/dashboard' : '/dashboard';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
