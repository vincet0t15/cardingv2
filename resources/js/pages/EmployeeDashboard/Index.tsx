import { CustomComboBox } from '@/components/CustomComboBox';
import { EmployeeCard } from '@/components/EmployeeCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/standard-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Head, router } from '@inertiajs/react';
import { Menu, Printer } from 'lucide-react';
import { useState } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface EmployeeDashboardProps {
    employee: any;
    deductions: Record<string, any[]>;
    claims: Record<string, any[]>;
    adjustments: Record<string, any[]>;
    totalDeductions: number;
    totalClaims: number;
    totalAdjustments: number;
    availableYears: number[];
    filters: {
        month: string | null;
        year: string | null;
    };
    userRoles: string[];
    pagination: {
        deductions: { currentPage: number; totalPages: number; total: number };
        claims: { currentPage: number; totalPages: number; total: number };
        adjustments: { currentPage: number; totalPages: number; total: number };
    };
}

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount);
};

const getAmountValue = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'object' && 'amount' in val) return isNaN(val.amount) ? 0 : val.amount;
    return 0;
};

const getEffectiveAmount = (history: any[] | undefined, year: number, month: number): number => {
    if (!history || history.length === 0) return 0;

    const periodEndDate = new Date(year, month, 0);
    const sortedHistory = [...history].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

    for (const record of sortedHistory) {
        const effectiveDate = new Date(record.effective_date);
        if (effectiveDate <= periodEndDate) {
            return Number(record.amount) || 0;
        }
    }

    return Number(sortedHistory[sortedHistory.length - 1]?.amount ?? 0);
};

export default function EmployeeDashboard({
    employee,
    deductions,
    claims,
    adjustments,
    totalDeductions,
    totalClaims,
    totalAdjustments,
    availableYears,
    filters,
    userRoles,
    pagination,
}: EmployeeDashboardProps) {
    const [activeTab, setActiveTab] = useState<'deductions' | 'claims' | 'adjustments'>('deductions');

    const handleFilterChange = (key: string, value: string | null) => {
        router.get(route('employee.dashboard'), { ...filters, [key]: value || undefined, page: 1 }, { preserveState: true, preserveScroll: true });
    };

    const handlePageChange = (page: number) => {
        router.get(route('employee.dashboard'), { ...filters, page }, { preserveState: true, preserveScroll: true });
    };

    const handlePrint = (period: string, type: 'deductions' | 'claims' | 'adjustments') => {
        const [year, month] = period.split('-');
        window.open(route('employees.print', [employee.id, { month, year, type }]), '_blank');
    };

    const getPeriodLabel = (period: string) => {
        const [year, month] = period.split('-');
        return `${MONTHS[parseInt(month) - 1]} ${year}`;
    };

    const renderDeductions = () => {
        const sumAmounts = (items: any[]) => items.reduce((sum, d) => sum + getAmountValue(d.amount), 0);

        return (
            <div className="space-y-4">
                {Object.keys(deductions).length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">No deductions found</div>
                ) : (
                    Object.entries(deductions).map(([period, items]: [string, any]) => {
                        const [year, month] = period.split('-');
                        const yearNum = parseInt(year);
                        const monthNum = parseInt(month);

                        const salary = getEffectiveAmount(employee.salaries, yearNum, monthNum);
                        const pera = employee.latestPera ? getAmountValue(employee.latestPera.amount) : 0;
                        const rata = employee.latestRata ? getAmountValue(employee.latestRata.amount) : 0;
                        const grossPay = salary + pera + rata;
                        const totalDeductions = sumAmounts(items);
                        const netPay = grossPay - totalDeductions;

                        return (
                            <div key={period} className="w-full overflow-hidden rounded-lg border bg-white shadow-sm">
                                <div className="bg-muted/50 flex flex-col gap-2 border-b px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{getPeriodLabel(period)}</span>
                                        <span className="text-muted-foreground text-xs">({items.length} deduction(s))</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-slate-500">Net Pay:</span>
                                        <span className="font-semibold text-green-600">{formatCurrency(netPay)}</span>
                                    </div>
                                </div>

                                {/* Compensation Summary Table - Grid Layout */}
                                <div className="grid grid-cols-3 gap-3 border-b bg-gradient-to-br from-slate-50 to-white p-4">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground mb-1 text-xs font-semibold">Basic Salary</span>
                                        <span className="text-xl font-bold text-slate-900">{formatCurrency(salary)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground mb-1 text-xs font-semibold">PERA</span>
                                        <span className="text-xl font-bold text-slate-900">+ {formatCurrency(pera)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground mb-1 text-xs font-semibold">RATA</span>
                                        <span className="text-xl font-bold text-slate-900">+ {formatCurrency(rata)}</span>
                                    </div>
                                    <div className="flex flex-col rounded-lg border border-blue-100 bg-blue-50 p-3">
                                        <span className="mb-1 text-xs font-semibold text-blue-600">Gross Pay</span>
                                        <span className="text-xl font-bold text-blue-700">{formatCurrency(grossPay)}</span>
                                    </div>
                                    <div className="flex flex-col rounded-lg border border-red-100 bg-red-50 p-3">
                                        <span className="mb-1 text-xs font-semibold text-red-600">Total Deductions</span>
                                        <span className="text-xl font-bold text-red-700">- {formatCurrency(totalDeductions)}</span>
                                    </div>
                                    <div className="flex flex-col rounded-lg border border-green-100 bg-green-50 p-3">
                                        <span className="mb-1 text-xs font-semibold text-green-600">Net Pay</span>
                                        <span className="text-xl font-bold text-green-700">{formatCurrency(netPay)}</span>
                                    </div>
                                </div>

                                {/* Deductions Detail Table */}
                                <div className="w-full overflow-hidden">
                                    <Table className="rounded-t-none">
                                        <TableHeader className="bg-muted/20">
                                            <TableRow>
                                                <TableHead className="flex-1">Type</TableHead>
                                                <TableHead className="w-24 text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((d: any) => (
                                                <TableRow key={d.id}>
                                                    <TableCell className="font-medium">{d.deduction_type?.name || 'Unknown'}</TableCell>
                                                    <TableCell className="text-right whitespace-nowrap">
                                                        {formatCurrency(getAmountValue(d.amount))}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );
    };

    const renderClaims = () => {
        const sumAmounts = (items: any[]) => items.reduce((sum, c) => sum + getAmountValue(c.amount), 0);

        return (
            <div className="space-y-4">
                {Object.keys(claims).length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">No claims found</div>
                ) : (
                    Object.entries(claims).map(([period, items]: [string, any]) => (
                        <div key={period} className="rounded-lg border">
                            <div className="bg-muted/50 flex flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{getPeriodLabel(period)}</span>
                                    <span className="text-muted-foreground text-xs">({items.length} items)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-500">Total:</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(sumAmounts(items))}</span>
                                </div>
                            </div>
                            <div className="w-full">
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow>
                                            <TableHead className="flex-1">Type</TableHead>
                                            <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                                            <TableHead className="w-24 text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((c: any) => (
                                            <TableRow key={c.id}>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            c.claim_type?.code === 'TRAVEL'
                                                                ? 'default'
                                                                : c.claim_type?.code === 'OVERTIME'
                                                                  ? 'secondary'
                                                                  : 'outline'
                                                        }
                                                    >
                                                        {c.claim_type?.code}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {c.claim_date
                                                        ? new Date(c.claim_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-right whitespace-nowrap">
                                                    {formatCurrency(getAmountValue(c.amount))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    const renderAdjustments = () => {
        const sumAmounts = (items: any[]) => items.reduce((sum, a) => sum + getAmountValue(a.amount), 0);

        return (
            <div className="space-y-4">
                {Object.keys(adjustments).length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">No adjustments found</div>
                ) : (
                    Object.entries(adjustments).map(([period, items]: [string, any]) => (
                        <div key={period} className="rounded-lg border">
                            <div className="bg-muted/50 flex items-center justify-between px-4 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{getPeriodLabel(period)}</span>
                                    <span className="text-muted-foreground text-xs">({items.length} items)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-500">Total:</span>
                                    <span className="font-semibold text-purple-600">{formatCurrency(sumAmounts(items))}</span>
                                </div>
                            </div>
                            <div className="w-full">
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow>
                                            <TableHead className="flex-1">Type</TableHead>
                                            <TableHead className="w-24 text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((a: any) => (
                                            <TableRow key={a.id}>
                                                <TableCell>
                                                    <Badge variant="secondary">{a.adjustment_type?.name}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(getAmountValue(a.amount))}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    return (
        <TooltipProvider>
            <div className="bg-background min-h-screen w-full">
                <Head title="Employee Dashboard" />
                {/* Mobile Header */}
                <div className="bg-card sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 md:hidden">
                    <h1 className="font-semibold">My Dashboard</h1>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex w-full flex-col gap-6 p-4 md:p-8 lg:p-10">
                    <EmployeeCard
                        employee={employee}
                        totalDeductions={totalDeductions}
                        totalClaims={totalClaims}
                        totalAdjustments={totalAdjustments}
                    />

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <CustomComboBox
                            key={`month-${filters.month}`}
                            items={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
                            placeholder="All Months"
                            value={filters.month || null}
                            onSelect={(value) => handleFilterChange('month', value)}
                            showClear
                        />
                        <CustomComboBox
                            key={`year-${filters.year}`}
                            items={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
                            placeholder="All Years"
                            value={filters.year || null}
                            onSelect={(value) => handleFilterChange('year', value)}
                            showClear
                        />
                    </div>

                    {/* Tabs */}
                    <div className="w-full space-y-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <Tabs
                                value={activeTab}
                                onValueChange={(value) => setActiveTab(value as 'deductions' | 'claims' | 'adjustments')}
                                className="flex-1"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <TabsList className="bg-muted/50 grid grid-cols-3">
                                        <TabsTrigger value="deductions">Deductions ({Object.keys(deductions).length})</TabsTrigger>
                                        <TabsTrigger value="claims">Claims ({Object.keys(claims).length})</TabsTrigger>
                                        <TabsTrigger value="adjustments">Adjustments ({Object.keys(adjustments).length})</TabsTrigger>
                                    </TabsList>
                                    <Button
                                        variant="default"
                                        size="default"
                                        onClick={() => {
                                            const data = activeTab === 'deductions' ? deductions : activeTab === 'claims' ? claims : adjustments;
                                            const period = Object.keys(data)[0];
                                            if (period) handlePrint(period, activeTab);
                                        }}
                                        className="gap-2"
                                    >
                                        <Printer className="h-4 w-4" /> Print
                                    </Button>
                                </div>
                                <TabsContent value="deductions" className="mt-4">
                                    {renderDeductions()}
                                </TabsContent>
                                <TabsContent value="claims" className="mt-4">
                                    {renderClaims()}
                                </TabsContent>
                                <TabsContent value="adjustments" className="mt-4">
                                    {renderAdjustments()}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
                <Toaster position="top-right" />
            </div>
        </TooltipProvider>
    );
}
