import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup } from '@/types';
import { Link } from '@inertiajs/react';

import {
    Banknote,
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
    MinusSquare,
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
                title: 'Deduction Types',
                href: '/settings/deduction-types',
                icon: MinusSquare,
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
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
