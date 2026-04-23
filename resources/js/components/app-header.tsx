import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuList } from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { NavGroup, type BreadcrumbItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Banknote,
    Building2,
    Calculator,
    DollarSign,
    FileText,
    HardHat,
    Key,
    LayoutGrid,
    LucideMoveVertical,
    Menu,
    Receipt,
    ReceiptCent,
    Settings,
    Shield,
    Shirt,
    Truck,
    UserCheck,
    UserRoundPen,
    Wallet,
} from 'lucide-react';
import { NavMenu } from './NavMenu';

const mainNavItems: NavGroup[] = [
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

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    return (
        <>
            <div className="border-sidebar-border/80 border-b">
                <div className="mx-auto grid h-16 grid-cols-3 items-center px-4">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2 h-[34px] w-[34px]">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-sidebar flex h-full w-64 flex-col items-stretch justify-between">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetHeader className="flex justify-start p-4 text-left">
                                    <Link href="/dashboard" className="flex w-full items-center gap-3">
                                        <div className="bg-primary shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
                                            <Building2 className="h-5 w-5 text-white dark:text-slate-900" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm leading-none font-bold text-slate-900 dark:text-white">ECMS</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Employee Compensation Management</p>
                                        </div>
                                    </Link>
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col">
                                    <nav className="flex flex-1 flex-col gap-2 p-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground px-3 pb-1 text-xs font-semibold">General</p>
                                            <Link
                                                href="/dashboard"
                                                prefetch
                                                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-3 py-2"
                                            >
                                                <LayoutGrid className="h-5 w-5" />
                                                <span className="font-medium">Dashboard</span>
                                            </Link>
                                        </div>
                                        <div className="mt-1">
                                            <p className="text-muted-foreground px-3 pb-1 text-xs font-semibold">Payroll</p>
                                            <div className="flex flex-col gap-1">
                                                {mainNavItems
                                                    .find((g) => g.title === 'Payroll')
                                                    ?.children?.map((item) => (
                                                        <Link
                                                            key={item.title}
                                                            href={item.href}
                                                            prefetch
                                                            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-3 py-2"
                                                        >
                                                            {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    ))}
                                            </div>
                                        </div>
                                        <div className="mt-1">
                                            <p className="text-muted-foreground px-3 pb-1 text-xs font-semibold">Compensation</p>
                                            <div className="flex flex-col gap-1">
                                                {mainNavItems
                                                    .find((g) => g.title === 'Compensation')
                                                    ?.children?.map((item) => (
                                                        <Link
                                                            key={item.title}
                                                            href={item.href}
                                                            prefetch
                                                            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-3 py-2"
                                                        >
                                                            {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    ))}
                                            </div>
                                        </div>
                                        <div className="mt-1">
                                            <p className="text-muted-foreground px-3 pb-1 text-xs font-semibold">Settings</p>
                                            <div className="flex flex-col gap-1">
                                                {mainNavItems
                                                    .find((g) => g.title === 'Settings')
                                                    ?.children?.map((item) => (
                                                        <Link
                                                            key={item.title}
                                                            href={item.href}
                                                            prefetch
                                                            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-3 py-2"
                                                        >
                                                            {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    ))}
                                            </div>
                                        </div>
                                    </nav>
                                    <Separator className="bg-sidebar-border mt-auto" />
                                    <div className="flex items-center gap-3 p-4">
                                        <Avatar className="size-9 rounded-full">
                                            <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                            <AvatarFallback>{getInitials(auth.user.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm leading-tight font-medium">{auth.user.name}</p>
                                            <p className="text-muted-foreground text-xs leading-tight">{auth.user.username}</p>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="relative contents">
                        {/* Left: Logo */}
                        <div className="flex items-center justify-self-start">
                            <Link href="/dashboard" prefetch className="flex items-center gap-3">
                                <div className="bg-primary shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
                                    <Building2 className="h-5 w-5 text-white dark:text-slate-900" />
                                </div>
                                <div className="hidden min-w-0 sm:block">
                                    <p className="text-sm leading-none font-bold text-slate-900 dark:text-white">ECMS</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Employee Compensation Management</p>
                                </div>
                            </Link>
                        </div>

                        {/* Center: Navigation */}
                        <div className="hidden justify-self-center lg:flex">
                            <NavigationMenu>
                                <NavigationMenuList className="flex items-center space-x-2">
                                    {/* <NavMain2 items={mainNavItems} /> */}
                                    <NavMenu items={mainNavItems} />
                                    {/* <MenubarDemo /> */}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center space-x-2 justify-self-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="size-10 rounded-full p-1">
                                        <Avatar className="size-8 overflow-hidden rounded-full">
                                            <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                            <AvatarFallback>{getInitials(auth.user.name)}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end">
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
