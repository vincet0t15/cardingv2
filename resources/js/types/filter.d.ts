import type { PageProps as InertiaPageProps } from '@inertiajs/core';

export interface FilterProps {
    search?: string;
    [key: string]: any;

}

interface MyPageProps extends InertiaPageProps {
    filters: FilterProps;
}
