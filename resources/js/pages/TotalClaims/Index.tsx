import { CustomComboBox } from '@/components/CustomComboBox';
import Pagination from '@/components/paginationData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { ArrowUpRight, FileText, Printer, Receipt } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Total Claims',
        href: '/total-claims',
    },
];

const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface ClaimTypeSummary {
    id: number;
    name: string;
    code: string;
    total_amount: number;
    claim_count: number;
}

interface Summary {
    total_claim_types: number;
    total_claims: number;
    total_amount: number;
}

interface TotalClaimsProps {
    claimTypes: ClaimTypeSummary[];
    summary: Summary;
    filters: {
        month: string | null;
        year: number | null;
        per_page: number | null;
    };
    pagination: {
        current_page: number;
        total_pages: number;
        total_records: number;
        per_page: number;
    };
}

export default function TotalClaimsIndex({ claimTypes, summary, filters }: TotalClaimsProps) {
    const handleFilterChange = (key: string, value: any) => {
        router.get(
            route('total-claims.index'),
            {
                ...filters,
                [key]: value || null,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 5;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => ({
        value: (startYear + i).toString(),
        label: (startYear + i).toString(),
    }));

    const getPeriodLabel = () => {
        const monthLabel = filters.month ? months.find((m) => m.value === filters.month)?.label : 'All Months';
        const yearLabel = filters.year || currentYear;
        return `${monthLabel} ${yearLabel}`;
    };

    const perPage = filters.per_page || pagination.per_page;
    const isAll = filters.per_page === null || (filters.per_page === undefined && pagination.total_pages === 1);
    const currentPerPage = isAll ? pagination.total_records : perPage;

    const paginatedData: PaginatedDataResponse<ClaimTypeSummary> = {
        current_page: isAll ? 1 : pagination.current_page,
        from: isAll ? 1 : (pagination.current_page - 1) * currentPerPage + 1,
        to: isAll ? pagination.total_records : Math.min(pagination.current_page * currentPerPage, pagination.total_records),
        last_page: isAll ? 1 : pagination.total_pages,
        path: route('total-claims.index'),
        per_page: currentPerPage,
        total: pagination.total_records,
        links: isAll
            ? [{ url: null, label: '1', active: true }]
            : [
                { url: pagination.current_page > 1 ? route('total-claims.index', { ...filters, page: pagination.current_page - 1 }) : null, label: '&laquo; Previous', active: false },
                ...Array.from({ length: pagination.total_pages }, (_, i) => ({
                    url: route('total-claims.index', { ...filters, page: i + 1 }),
                    label: String(i + 1),
                    active: i + 1 === pagination.current_page,
                })),
                { url: pagination.current_page < pagination.total_pages ? route('total-claims.index', { ...filters, page: pagination.current_page + 1 }) : null, label: 'Next &raquo;', active: false },
            ],
        data: claimTypes,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Total Claims" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 p-4 dark:border-violet-800 dark:bg-gradient-to-r dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/30">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-violet-100 p-1.5 dark:bg-violet-900/50">
                            <Receipt className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="text-sm">
                            <p className="mb-1 font-semibold text-violet-800 dark:text-violet-200">How to view employees by claim type:</p>
                            <p className="text-violet-700 dark:text-violet-300">
                                Click on any <span className="font-medium text-violet-900 dark:text-violet-100">claim type name</span> in the table below to see all employees who have that specific claim.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Total Claims</h1>
                        <p className="text-muted-foreground mt-1">Overview of all claim types with totals</p>
                    </div>
                    <Button onClick={() => window.open(route('total-claims.print', filters), '_blank')}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Filter Claims
                        </CardTitle>
                        <CardDescription>Filter by month and year to view claim totals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Month</label>
                                <CustomComboBox
                                    items={months}
                                    placeholder="Select month"
                                    value={filters.month || null}
                                    onSelect={(value) => handleFilterChange('month', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Year</label>
                                <CustomComboBox
                                    items={years}
                                    placeholder="Select year"
                                    value={(filters.year || currentYear).toString()}
                                    onSelect={(value) => handleFilterChange('year', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Show</label>
                                <CustomComboBox
                                    items={[
                                        { value: '25', label: '25 rows' },
                                        { value: '50', label: '50 rows' },
                                        { value: '100', label: '100 rows' },
                                        { value: 'all', label: 'All' },
                                    ]}
                                    placeholder="Select"
                                    value={filters.per_page ? filters.per_page.toString() : '25'}
                                    onSelect={(value) => handleFilterChange('per_page', value === 'all' ? null : (value ?? '25'))}
                                    showClear={false}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Claim Types</CardTitle>
                            <FileText className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_claim_types}</div>
                            <p className="text-muted-foreground text-xs">Distinct types</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                            <Receipt className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_claims}</div>
                            <p className="text-muted-foreground text-xs">For {getPeriodLabel()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <FileText className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_amount)}</div>
                            <p className="text-muted-foreground text-xs">Total claims value</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Claims by Type
                        </CardTitle>
                        <CardDescription>Click on a claim type to view employees with claims</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {claimTypes.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center">#</TableHead>
                                        <TableHead>Claim Type</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead className="text-right">Number of Claims</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {claimTypes.map((claimType, index) => (
                                        <TableRow key={claimType.id} className="hover:bg-muted/50">
                                            <TableCell className="text-center">
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    {index + 1}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    className="group flex items-center gap-1 text-left hover:underline"
                                                    onClick={() => {
                                                        router.get(
                                                            route('total-claims.employees', claimType.id),
                                                            {
                                                                month: filters.month,
                                                                year: filters.year,
                                                            },
                                                            { preserveState: true, preserveScroll: true }
                                                        );
                                                    }}
                                                >
                                                    <span className="text-primary font-medium text-blue-600 group-hover:text-blue-800 dark:text-blue-400 dark:group-hover:text-blue-300">{claimType.name}</span>
                                                    <ArrowUpRight className="h-3 w-3 text-blue-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <span className="bg-muted rounded px-2 py-1 text-xs font-mono">{claimType.code}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{claimType.claim_count}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(claimType.total_amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <tfoot>
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell className="text-right" colSpan={3}>
                                            TOTAL:
                                        </TableCell>
                                        <TableCell className="text-right">{summary.total_claims}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(summary.total_amount)}</TableCell>
                                    </TableRow>
                                </tfoot>
                            </Table>
                        ) : (
                            <div className="py-12 text-center">
                                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <FileText className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-muted-foreground text-sm">No claims data found for the selected filters</p>
                            </div>
                        )}

                        <Pagination data={paginatedData} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}