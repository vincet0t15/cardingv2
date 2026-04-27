import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { UserX } from 'lucide-react';

interface UnlinkedProps {
    message: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/employee/dashboard',
    },
];

export default function Unlinked({ message }: UnlinkedProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex min-h-[400px] items-center justify-center p-4">
                <div className="text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                        <UserX className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold">Account Not Linked</h2>
                    <p className="text-muted-foreground max-w-md">{message}</p>
                </div>
            </div>
        </AppLayout>
    );
}
