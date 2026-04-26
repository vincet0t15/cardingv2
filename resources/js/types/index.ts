import type { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';
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
    permissions?: string[];
    roles?: string[];
    [key: string]: unknown; // This allows for additional properties...
}

export interface Adjustment {
    id: number;
    employee_id: number;
    employee: {
        id: number;
        first_name: string;
        last_name: string;
        employee_id?: string;
        position?: string;
    };
    adjustment_type: string;
    // Optional relation object when backend includes the adjustment type relation
    adjustmentType?: {
        id?: number;
        name?: string;
        description?: string | null;
        effect?: string | null;
        requires_approval?: boolean | null;
        created_by?: number | null;
        deleted_at?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        [key: string]: any;
    };
    amount: number;
    pay_period_month: number;
    pay_period_year: number;
    effectivity_date: string;
    reference_id?: string;
    reference_type?: string;
    // Optional relation object when backend includes the reference type relation
    referenceType?: {
        id?: number;
        name?: string;
        [key: string]: any;
    };
    status: 'pending' | 'approved' | 'rejected' | 'processed';
    reason: string;
    remarks?: string;
    approved_by?: number;
    approved_at?: string;
    processed_at?: string;
    processed_by?: string;
    created_at: string;
    updated_at: string;
}
