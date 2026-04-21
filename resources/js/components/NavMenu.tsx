'use client';

import * as React from 'react';

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';

const components: { title: string; href: string; description: string }[] = [
    {
        title: 'Alert Dialog',
        href: '/docs/primitives/alert-dialog',
        description: 'A modal dialog that interrupts the user with important content and expects a response.',
    },
    {
        title: 'Hover Card',
        href: '/docs/primitives/hover-card',
        description: 'For sighted users to preview content available behind a link.',
    },
    {
        title: 'Progress',
        href: '/docs/primitives/progress',
        description: 'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
    },
    {
        title: 'Scroll-area',
        href: '/docs/primitives/scroll-area',
        description: 'Visually or semantically separates content.',
    },
    {
        title: 'Tabs',
        href: '/docs/primitives/tabs',
        description: 'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
    },
    {
        title: 'Tooltip',
        href: '/docs/primitives/tooltip',
        description: 'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
    },
];

export function NavMenu({ items = [] }: { items: NavGroup[] }) {
    const page = usePage();
    return (
        <NavigationMenu>
            <NavigationMenuList>
                {items.map((group) =>
                    group.children?.length ? (
                        <NavigationMenuItem key={group.title}>
                            <NavigationMenuTrigger className="ml-2 flex items-center gap-2">
                                {group.icon && <group.icon className="h-4 w-4" />}
                                {group.title}
                            </NavigationMenuTrigger>

                            <NavigationMenuContent>
                                <ul className="w-96">
                                    {group.children.map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className={cn(
                                                'hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                                                page.url.startsWith(item.href) && 'bg-accent text-accent-foreground',
                                            )}
                                        >
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span>{item.title}</span>
                                        </Link>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    ) : (
                        <NavigationMenuItem key={group.title}>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Link
                                    href={group.href ?? '#'}
                                    className={cn('hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md p-2 text-sm', {
                                        'bg-accent text-accent-foreground': page.url.startsWith(group.href ?? ''),
                                    })}
                                >
                                    {group.icon && <group.icon className="h-4 w-4" />}
                                    {group.title}
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ),
                )}
            </NavigationMenuList>
        </NavigationMenu>
    );
}

function ListItem({ title, children, href, ...props }: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
    return (
        <li {...props}>
            <NavigationMenuLink asChild>
                <Link href={href}>
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="leading-none font-medium">{title}</div>
                        <div className="text-muted-foreground line-clamp-2">{children}</div>
                    </div>
                </Link>
            </NavigationMenuLink>
        </li>
    );
}
