'use client';

import { TrendingUp } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export interface FundChartData {
    code: string;
    description: string | null;
    total_amount: number;
}

export interface ChartPieMultipleProps {
    data: FundChartData[];
    title?: string;
    description?: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Professional color palette for trust funds
const COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#84cc16', // lime-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#e11d48', // rose-500
    '#0ea5e9', // sky-500
    '#a855f7', // purple-500
    '#22c55e', // green-500
];

export function ChartPieMultiple({ data, title = 'Salaries by Source of Fund', description }: ChartPieMultipleProps) {
    const total = data.reduce((sum, item) => sum + item.total_amount, 0);

    // Transform data for Recharts
    const chartData = data.map((item, index) => ({
        name: item.code,
        value: item.total_amount,
        description: item.description,
        color: COLORS[index % COLORS.length],
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={120}
                                    innerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                    paddingAngle={2}
                                    strokeWidth={2}
                                    stroke="#ffffff"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload[0]) {
                                            const percentage = total > 0 ? ((payload[0].value as number) / total) * 100 : 0;
                                            return (
                                                <div className="rounded-lg border bg-white p-3 shadow-md">
                                                    <p className="font-medium">{payload[0].payload.name}</p>
                                                    {payload[0].payload.description && (
                                                        <p className="text-muted-foreground text-xs">{payload[0].payload.description}</p>
                                                    )}
                                                    <p className="mt-1 font-semibold" style={{ color: payload[0].payload.color }}>
                                                        {formatCurrency(payload[0].value as number)}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">{percentage.toFixed(1)}% of total</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <TrendingUp className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-muted-foreground">No data available for this period</p>
                    </div>
                )}
            </CardContent>
            {data.length > 0 && (
                <>
                    <CardContent className="pt-0">
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                            {chartData.map((entry, index) => {
                                return (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium">{entry.name}</p>
                                            <p className="text-muted-foreground text-xs">{formatCurrency(entry.value)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm">
                        <div className="flex gap-2 leading-none font-medium">
                            Total: {formatCurrency(total)} <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="text-muted-foreground leading-none">
                            Showing distribution across {data.length} fund{data.length !== 1 ? 's' : ''}
                        </div>
                    </CardFooter>
                </>
            )}
        </Card>
    );
}
