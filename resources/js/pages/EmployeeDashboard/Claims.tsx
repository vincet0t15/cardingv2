import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Toaster } from '@/components/ui/sonner';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, CheckCircle2, ArrowLeft, Coins, Calendar } from 'lucide-react';
import type { PaginatedDataResponse } from '@/types/pagination';

// ─── Types ───────────────────────────────────────────────────────────

interface ClaimType {
    id: number;
    code: string;
    name: string;
    description?: string;
}

interface Claim {
    id: number;
    claim_type_id: number;
    employee_id: number;
    amount: number;
    purpose: string;
    claim_date: string;
    remarks?: string;
    created_at: string;
    claim_type: { id: number; code: string; name: string } | null;
}

interface ClaimsPageProps {
    claims: PaginatedDataResponse<Claim>;
    claimTypes: ClaimType[];
    filters: {
        claim_type_id?: string;
    };
    stats: {
        total: number;
        totalAmount: number;
        recentCount: number;
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────

const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₱0.00';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
};

const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─── Main Component ──────────────────────────────────────────────────

export default function EmployeeClaims({ claims, claimTypes, filters, stats }: ClaimsPageProps) {
    const handleFilterChange = (key: string, value: string | null) => {
        router.get(route('employee.claims.index'), { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    };

    const getStatusBadge = (claim: Claim) => {
        return (
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Submitted
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Head title="My Claims" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={route('employee.dashboard')} className="text-slate-500 hover:text-slate-700">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <h1 className="text-2xl font-bold text-slate-800">My Claims</h1>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">View your submitted claims and deductions.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-700">
                                <FileText className="h-4 w-4" /> Total Claims
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-800">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                                <Coins className="h-4 w-4" /> Total Amount
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-emerald-800">{formatCurrency(stats.totalAmount)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700">
                                <Calendar className="h-4 w-4" /> Recent (30 days)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-amber-800">{stats.recentCount}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600">Filter by type:</span>
                    <CustomComboBox
                        key={`type-${filters.claim_type_id}`}
                        items={[
                            { value: '', label: 'All Types' },
                            ...claimTypes.map((ct) => ({ value: String(ct.id), label: ct.name })),
                        ]}
                        placeholder="All Types"
                        value={filters.claim_type_id || ''}
                        onSelect={(value) => handleFilterChange('claim_type_id', value || null)}
                        className="w-56"
                    />
                </div>

                {/* Claims Table */}
                <Card>
                    <CardHeader className="border-b bg-slate-50/50 py-3">
                        <CardTitle className="text-base font-semibold">Claim History</CardTitle>
                        <CardDescription className="text-xs">Your submitted claims and deductions</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {claims.data.length === 0 ? (
                            <div className="flex flex-col items-center py-16 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                    <FileText className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700">No Claims Yet</h3>
                                <p className="mt-1 text-sm text-slate-500">No claim records found for your account.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Purpose</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-28 text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {claims.data.map((claim) => (
                                        <TableRow key={claim.id}>
                                            <TableCell className="text-sm whitespace-nowrap">{formatDate(claim.claim_date)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-slate-200 bg-slate-50">
                                                    {claim.claim_type?.code || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-sm text-slate-600">{claim.purpose}</TableCell>
                                            <TableCell>{getStatusBadge(claim)}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(claim.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {claims.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" disabled={claims.current_page === 1} asChild>
                            <Link href={claims.first_page_url || '#'}>First</Link>
                        </Button>
                        <Button variant="outline" size="sm" disabled={!claims.prev_page_url} asChild>
                            <Link href={claims.prev_page_url || '#'}>Previous</Link>
                        </Button>
                        <span className="px-4 text-sm text-slate-500">
                            Page {claims.current_page} of {claims.last_page}
                        </span>
                        <Button variant="outline" size="sm" disabled={!claims.next_page_url} asChild>
                            <Link href={claims.next_page_url || '#'}>Next</Link>
                        </Button>
                        <Button variant="outline" size="sm" disabled={claims.current_page === claims.last_page} asChild>
                            <Link href={claims.links?.[claims.links.length - 1]?.url || '#'}>Last</Link>
                        </Button>
                    </div>
                )}
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
