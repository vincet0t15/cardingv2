import Heading from '@/components/heading';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface AuditLogsPerformanceProps {
    performanceMetrics?: Array<{
        user_id: number;
        user_name: string;
        created_count: number;
        updated_count: number;
        deleted_count: number;
        total_actions: number;
    }>;
}
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Performance Metrics',
        href: '/audit-logs/performance',
    },
];
export default function Performance({ performanceMetrics = [] }: AuditLogsPerformanceProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance Metrics" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Performance Metrics" description="View user performance counts for adds and edits." />
                <PerformanceMetrics metrics={performanceMetrics} />
            </div>
        </AppLayout>
    );
}
