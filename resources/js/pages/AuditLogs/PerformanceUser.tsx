import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { AuditLog } from '@/types/auditLog';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';

interface PerformanceUserProps {
    user: {
        id: number;
        name: string;
    };
    auditLogs: {
        data: AuditLog[];
        links: any;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Performance Metrics',
        href: '/audit-logs/performance',
    },
    {
        title: 'User Activity',
        href: '#',
    },
];

export default function PerformanceUser({ user, auditLogs }: PerformanceUserProps) {
    const getActionBadgeClass = (action: string) => {
        const classes: Record<string, string> = {
            created: 'bg-green-100 text-green-800',
            updated: 'bg-blue-100 text-blue-800',
            deleted: 'bg-red-100 text-red-800',
            restored: 'bg-purple-100 text-purple-800',
        };
        return classes[action] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Performance Activity — ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                        <p className="text-sm text-slate-500">All audit activity for this user.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('audit-logs.performance')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Metrics
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left text-sm font-medium">Date & Time</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Model</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center text-sm">
                                                No activity found for this user.
                                            </td>
                                        </tr>
                                    ) : (
                                        auditLogs.data.map((log) => (
                                            <tr key={log.id} className="hover:bg-muted/50 border-b">
                                                <td className="px-4 py-3 text-sm">
                                                    <div>{new Date(log.created_at).toLocaleDateString()}</div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {new Date(log.created_at).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Badge className={getActionBadgeClass(log.action)}>
                                                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium">{log.model_type.split('\\').pop()}</td>
                                                <td className="max-w-xs truncate px-4 py-3 text-sm">{log.description || '-'}</td>
                                                <td className="px-4 py-3 font-mono text-sm text-xs">{log.ip_address || '-'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link href={route('audit-logs.show', log.id)}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3">
                            <p className="text-muted-foreground text-sm">
                                Showing {auditLogs.data.length} of {auditLogs.total} results
                            </p>
                            <div className="flex gap-1">
                                {auditLogs.links
                                    .filter(
                                        (_: any, index: number) =>
                                            index === 0 || index === auditLogs.links.length - 1 || auditLogs.links[index]?.active,
                                    )
                                    .map((link: any, index: number) => (
                                        <Link
                                            key={index}
                                            href={link.url ?? '#'}
                                            preserveState
                                            preserveScroll
                                            className={`rounded border px-3 py-1 text-sm ${
                                                link.active ? 'bg-primary text-white' : 'bg-background hover:bg-muted'
                                            } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
