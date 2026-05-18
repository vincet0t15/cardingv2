'use client';

import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { router } from '@inertiajs/react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import React from 'react';

export interface OfficeClaimsData {
    office_name: string;
    office_code: string;
    total_claims: number;
    total_amount: number;
}

export interface ChartOfficeClaimsProps {
    claimsData: OfficeClaimsData[];
    overtimeData: OfficeClaimsData[];
    title?: string;
    description?: string;
}

const chartConfig = {
    amount: {
        label: 'Amount',
        color: 'hsl(217.2 91.2% 60%)',
    },
} satisfies ChartConfig;

export function ChartOfficeClaims({ claimsData, overtimeData, title = 'Claims & Overtime by Office', description }: ChartOfficeClaimsProps) {
    const [filterType, setFilterType] = React.useState<'all' | 'claims' | 'overtime'>('all');

    // Get data based on filter type
    const getData = () => {
        if (filterType === 'claims') {
            return claimsData;
        } else if (filterType === 'overtime') {
            return overtimeData;
        } else {
            // Combine both datasets by office
            const officeMap = new Map<string, OfficeClaimsData>();

            // Add claims data
            claimsData.forEach((item) => {
                const key = item.office_code || item.office_name;
                if (!officeMap.has(key)) {
                    officeMap.set(key, {
                        office_name: item.office_name,
                        office_code: item.office_code,
                        total_claims: 0,
                        total_amount: 0,
                    });
                }
                const existing = officeMap.get(key)!;
                existing.total_claims += item.total_claims;
                existing.total_amount += item.total_amount;
            });

            // Add overtime data
            overtimeData.forEach((item) => {
                const key = item.office_code || item.office_name;
                if (!officeMap.has(key)) {
                    officeMap.set(key, {
                        office_name: item.office_name,
                        office_code: item.office_code,
                        total_claims: 0,
                        total_amount: 0,
                    });
                }
                const existing = officeMap.get(key)!;
                existing.total_claims += item.total_claims;
                existing.total_amount += item.total_amount;
            });

            return Array.from(officeMap.values()).sort((a, b) => b.total_amount - a.total_amount);
        }
    };

    const data = getData();

    const chartData = data.map((item) => ({
        office: item.office_code || item.office_name,
        amount: item.total_amount,
        fullName: item.office_name,
        count: item.total_claims,
    }));

    const labelText = filterType === 'claims' ? 'Travel Claims' : filterType === 'overtime' ? 'Overtime' : 'Claims & Overtime';

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            {title}
                        </CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    <div className="flex items-center gap-2">
                        <ToggleGroup
                            type="single"
                            value={filterType}
                            onValueChange={(value) => value && setFilterType(value as 'all' | 'claims' | 'overtime')}
                        >
                            <ToggleGroupItem value="all" aria-label="Show All">
                                All
                            </ToggleGroupItem>
                            <ToggleGroupItem value="claims" aria-label="Show Claims">
                                Claims
                            </ToggleGroupItem>
                            <ToggleGroupItem value="overtime" aria-label="Show Overtime">
                                Overtime
                            </ToggleGroupItem>
                        </ToggleGroup>
                        <Button variant="ghost" size="sm" onClick={() => router.get(route('claims.report'))}>
                            View All
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <div className="w-full overflow-x-auto">
                        <ChartContainer config={chartConfig} className="min-h-[350px] w-full min-w-[500px]">
                            <BarChart accessibilityLayer data={chartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="office"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 3)}
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
                            <p className="text-muted-foreground">No {labelText.toLowerCase()} data available</p>
                        </div>
                    </div>
                )}
            </CardContent>
            {chartData.length > 0 && (
                <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="text-muted-foreground text-xs">Showing total {labelText.toLowerCase()} amounts per office</div>
                </CardFooter>
            )}
        </Card>
    );
}
