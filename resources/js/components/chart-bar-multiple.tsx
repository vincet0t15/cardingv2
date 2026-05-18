'use client';

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

export interface FundChartData {
    code: string;
    description: string | null;
    total_amount: number;
}

export interface ChartBarMultipleProps {
    data: FundChartData[];
    title?: string;
    description?: string;
    period?: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
    }).format(amount);
};

export function ChartBarMultiple({ data, title = 'Salaries by Source of Fund', description, period }: ChartBarMultipleProps) {
    // Transform data for Recharts
    const chartData = data.map((item) => ({
        name: item.code,
        amount: item.total_amount,
        description: item.description,
    }));

    // Calculate chart width based on data points (minimum 60px per bar)
    const minBarWidth = 60;
    const calculatedWidth = Math.max(chartData.length * minBarWidth, 400);

    const chartConfig = {
        amount: {
            label: 'Salary Amount',
            color: 'hsl(217.2 91.2% 60%)',
        },
    } satisfies ChartConfig;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {title}
                </CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <div className="w-full overflow-x-auto">
                        <ChartContainer config={chartConfig} className="min-h-[350px] w-full min-w-[500px]">
                            <BarChart accessibilityLayer data={chartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 5)}
                                />
                                <YAxis
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        if (value >= 1000) {
                                            return `₱${(value / 1000).toFixed(0)}k`;
                                        }
                                        return `₱${value}`;
                                    }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            indicator="dashed"
                                            formatter={(value, name, item) => {
                                                if (name === 'amount' && typeof value === 'number') {
                                                    return new Intl.NumberFormat('en-PH', {
                                                        style: 'currency',
                                                        currency: 'PHP',
                                                        minimumFractionDigits: 0,
                                                    }).format(value);
                                                }
                                                return value;
                                            }}
                                        />
                                    }
                                />
                                <Bar dataKey="amount" fill="var(--color-amount)" radius={4}>
                                    <LabelList
                                        dataKey="amount"
                                        position="top"
                                        formatter={(value) => {
                                            if (typeof value === 'number') {
                                                return new Intl.NumberFormat('en-PH', {
                                                    style: 'currency',
                                                    currency: 'PHP',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                }).format(value);
                                            }
                                            return String(value);
                                        }}
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            fill: 'hsl(217.2 91.2% 60%)',
                                        }}
                                    />
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </div>
                ) : (
                    <div className="flex min-h-[350px] items-center justify-center">
                        <div className="text-center">
                            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <TrendingUp className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-muted-foreground">No data available for this period</p>
                        </div>
                    </div>
                )}
            </CardContent>
            {data.length > 0 && (
                <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 leading-none font-medium">
                        Total: {formatCurrency(data.reduce((sum, item) => sum + item.total_amount, 0))} <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="text-muted-foreground leading-none">
                        Showing salary distribution across {data.length} fund{data.length !== 1 ? 's' : ''}
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
