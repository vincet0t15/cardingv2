import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { AuditLog } from '@/types/auditLog';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Download, Eye, Filter, Search } from 'lucide-react';

interface AuditLogsIndexProps {
    auditLogs: {
        data: AuditLog[];
        links: any;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    modelTypes: { value: string; label: string }[];
    users: { id: number; name: string }[];
    stats: {
        total_logs: number;
        today_logs: number;
        created_count: number;
        updated_count: number;
        deleted_count: number;
    };
    filters: {
        search?: string;
        action?: string;
        model_type?: string;
        user_id?: string;
        date_from?: string;
        date_to?: string;
        per_page?: string;
    };
}

export default function Index({ auditLogs, modelTypes, users, stats, filters }: AuditLogsIndexProps) {
    const handleFilterChange = (key: string, value: string | null) => {
        router.get(route('audit-logs.index'), { ...filters, [key]: value, page: 1 }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        router.get(route('audit-logs.index'), {}, { preserveState: false });
    };

    const exportLogs = () => {
        window.location.href = route('audit-logs.export', filters);
    };

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
        <AppLayout>
            <Head title="Audit Logs" />

            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
                    <Button onClick={exportLogs}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                            <Calendar className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_logs}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today</CardTitle>
                            <Calendar className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.today_logs}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Created</CardTitle>
                            <Badge className="bg-green-100 text-green-800">+</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.created_count}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Updated</CardTitle>
                            <Badge className="bg-blue-100 text-blue-800">~</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.updated_count}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Deleted</CardTitle>
                            <Badge className="bg-red-100 text-red-800">-</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.deleted_count}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Filter className="mr-2 h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="lg:col-span-2">
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                                    <Input
                                        placeholder="Search logs..."
                                        value={filters.search || ''}
                                        onChange={(e) => handleFilterChange('search', e.target.value || null)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div>
                                <Select
                                    value={filters.action || 'all'}
                                    onValueChange={(value) => handleFilterChange('action', value === 'all' ? null : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Actions</SelectItem>
                                        <SelectItem value="created">Created</SelectItem>
                                        <SelectItem value="updated">Updated</SelectItem>
                                        <SelectItem value="deleted">Deleted</SelectItem>
                                        <SelectItem value="restored">Restored</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Select
                                    value={filters.model_type || 'all'}
                                    onValueChange={(value) => handleFilterChange('model_type', value === 'all' ? null : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Models</SelectItem>
                                        {modelTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Select
                                    value={filters.user_id || 'all'}
                                    onValueChange={(value) => handleFilterChange('user_id', value === 'all' ? null : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="User" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={String(user.id)}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value || null)}
                                    placeholder="From"
                                />
                            </div>
                            <div>
                                <Input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value || null)}
                                    placeholder="To"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button variant="outline" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Logs Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left text-sm font-medium">Date & Time</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Model</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">IP Address</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center text-sm">
                                                No audit logs found
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
                                                <td className="px-4 py-3 text-sm">{log.user?.name || 'System'}</td>
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
