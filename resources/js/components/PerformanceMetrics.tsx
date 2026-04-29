import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface PerformanceMetric {
    user_id: number;
    user_name: string;
    created_count: number;
    updated_count: number;
    deleted_count: number;
    total_actions: number;
}

interface PerformanceMetricsProps {
    metrics?: PerformanceMetric[];
}

export default function PerformanceMetrics({ metrics = [] }: PerformanceMetricsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Adds</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Edits</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-muted-foreground px-4 py-8 text-center text-sm">
                                        No performance data available
                                    </td>
                                </tr>
                            ) : (
                                metrics.map((metric) => (
                                    <tr key={metric.user_id} className="hover:bg-muted/50 border-b">
                                        <td className="px-4 py-3 text-sm font-medium">{metric.user_name}</td>
                                        <td className="px-4 py-3 text-right text-sm">{metric.created_count}</td>
                                        <td className="px-4 py-3 text-right text-sm">{metric.updated_count}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
