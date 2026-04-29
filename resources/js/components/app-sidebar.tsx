import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';

import {
    Banknote,
    BarChart3,
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
        icon: Settings,
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
                href: '/audit-logs?tab=performance',
                icon: BarChart3,
            },
        ],
    },
];

const employeeNavItems: NavGroup[] = [
    {
        title: 'My Profile',
        icon: UserRoundPen,
        children: [
            {
                title: 'My Dashboard',
                href: '/employee/dashboard',
                icon: LayoutGrid,
            },
        ],
    },
];

export function AppSidebar() {
    const pageProps = usePage().props as {
        auth?: { user?: { is_employee?: boolean; is_admin?: boolean } | null };
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
    const performanceMetrics = pageProps.performanceMetrics ?? [];

    // If linked employee (not admin) → show employee nav only
    const isEmployeeOnly = authUser?.is_employee === true && authUser?.is_admin !== true;
    const navItems = isEmployeeOnly ? employeeNavItems : mainNavItems;
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
                {performanceMetrics.length > 0 && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel>Performance Metrics</SidebarGroupLabel>
                            <SidebarGroupContent>
                                {performanceMetrics.slice(0, 8).map((metric) => (
                                    <div key={metric.user_id} className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                                        <div className="font-medium">{metric.user_name}</div>
                                        <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-slate-500">
                                            <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">C {metric.created_count}</span>
                                            <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">U {metric.updated_count}</span>
                                            <span className="rounded bg-red-50 px-2 py-1 text-red-700">D {metric.deleted_count}</span>
                                        </div>
                                    </div>
                                ))}
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
