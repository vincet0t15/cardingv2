import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { AuditLog } from '@/types/auditLog';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Monitor, User } from 'lucide-react';

interface AuditLogShowProps {
    auditLog: AuditLog;
}

export default function Show({ auditLog }: AuditLogShowProps) {
    const getActionBadgeClass = (action: string) => {
        const classes: Record<string, string> = {
            created: 'bg-green-100 text-green-800',
            updated: 'bg-blue-100 text-blue-800',
            deleted: 'bg-red-100 text-red-800',
            restored: 'bg-purple-100 text-purple-800',
        };
        return classes[action] || 'bg-gray-100 text-gray-800';
    };

    const formatValue = (value: any) => {
        if (value === null) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    return (
        <AppLayout>
            <Head title={`Audit Log - ${auditLog.action}`} />

            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={route('audit-logs.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight">Audit Log Details</h2>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Action</label>
                                <div className="mt-1">
                                    <Badge className={getActionBadgeClass(auditLog.action)}>
                                        {auditLog.action.charAt(0).toUpperCase() + auditLog.action.slice(1)}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Model</label>
                                <div className="mt-1 font-medium">{auditLog.model_type.split('\\').pop()}</div>
                            </div>

                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Model ID</label>
                                <div className="mt-1 font-mono text-sm">{auditLog.model_id}</div>
                            </div>

                            {auditLog.description && (
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Description</label>
                                    <div className="mt-1">{auditLog.description}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* User & Timestamp */}
                    <Card>
                        <CardHeader>
                            <CardTitle>User & Timestamp</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-2">
                                <User className="text-muted-foreground mt-0.5 h-4 w-4" />
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">User</label>
                                    <div className="mt-1">{auditLog.user?.name || 'System'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4" />
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Date</label>
                                    <div className="mt-1">{new Date(auditLog.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Clock className="text-muted-foreground mt-0.5 h-4 w-4" />
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Time</label>
                                    <div className="mt-1">{new Date(auditLog.created_at).toLocaleTimeString()}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Monitor className="text-muted-foreground mt-0.5 h-4 w-4" />
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">IP Address</label>
                                    <div className="mt-1 font-mono text-sm">{auditLog.ip_address || 'N/A'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Changes */}
                {(auditLog.old_values || auditLog.new_values) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Changes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Old Values */}
                                {auditLog.old_values && Object.keys(auditLog.old_values).length > 0 && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-red-600">Old Values</h3>
                                        <div className="space-y-2 rounded-md border bg-red-50 p-3">
                                            {Object.entries(auditLog.old_values).map(([key, value]) => (
                                                <div key={key} className="text-sm">
                                                    <span className="text-muted-foreground font-medium">{key}:</span>{' '}
                                                    <span className="ml-1 font-mono text-xs">{formatValue(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* New Values */}
                                {auditLog.new_values && Object.keys(auditLog.new_values).length > 0 && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-green-600">New Values</h3>
                                        <div className="space-y-2 rounded-md border bg-green-50 p-3">
                                            {Object.entries(auditLog.new_values).map(([key, value]) => (
                                                <div key={key} className="text-sm">
                                                    <span className="text-muted-foreground font-medium">{key}:</span>{' '}
                                                    <span className="ml-1 font-mono text-xs">{formatValue(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* User Agent */}
                {auditLog.user_agent && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">User Agent</label>
                                <div className="mt-1 font-mono text-xs break-all">{auditLog.user_agent}</div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
