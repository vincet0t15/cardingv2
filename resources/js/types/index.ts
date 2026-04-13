import { LucideIcon } from 'lucide-react';
import type { InertiaLinkProps } from '@inertiajs/react';
export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

// export interface NavGroup {
//     title: string;
//     items: NavItem[];
// }

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
};

export type NavGroup = {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[];
};

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    username: string;
    avatar?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
