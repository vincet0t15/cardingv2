import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';
import { CustomComboBox } from '@/components/CustomComboBox';
import EditDeductionDialog from '@/components/EditDeductionDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/standard-table';
import type { Claim } from '@/types/claim';
import type { DeductionType } from '@/types/deductionType';
import type { Employee, Employee as EmployeeType } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { router } from '@inertiajs/react';
import { PencilIcon, Plus, Printer, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface CompensationDeductionsProps {
    employee: Employee;
    deductionTypes: DeductionType[];
    deductions?: Record<string, EmployeeDeduction[]>;
    periodsList?: string[];
    takenPeriods?: string[];
    availableYears?: number[];
    filters?: {
        deduction_month?: string;
        deduction_year?: string;
    };
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    allEmployees?: EmployeeType[];
    allClothingAllowances?: {
        id: number;
        amount: string | number;
        start_date: string;
        end_date: string | null;
        source_of_fund_code?: { code: string; description: string | null } | null;
    }[];
    allClaimsGrouped?: Record<string, Claim[]>;
    allAdjustmentsGrouped?: Record<string, any[]>;
}

export function CompensationDeductions({
    employee,
    deductionTypes,
    deductions = {},
    periodsList = [],
    takenPeriods = [],
    availableYears = [],
    filters = {},
    pagination,
    allEmployees = [],
    allClothingAllowances = [],
    allClaimsGrouped = {},
    allAdjustmentsGrouped = {},
}: CompensationDeductionsProps) {
    const goToPage = (page: number) => {
        router.get(
            route('manage.employees.index', employee.id),
            { deduction_page: page, deduction_month: filters.deduction_month, deduction_year: filters.deduction_year },
            { preserveState: true, preserveScroll: true },
        );
    };

    const applyFilter = (month: string | undefined, year: string | undefined) => {
        const params: Record<string, string> = {};
        if (month) params.deduction_month = month;
        if (year) params.deduction_year = year;
        router.get(route('manage.employees.index', employee.id), params, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        router.get(route('manage.employees.index', employee.id), {}, { preserveState: true, preserveScroll: true });
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);

    const getEffectiveAmount = (
        history: { amount: number; effective_date: string }[] | undefined,
        periodYear: number,
        periodMonth: number,
    ): number => {
        if (!history || history.length === 0) return 0;

        const periodEndDate = new Date(periodYear, periodMonth, 0);

        const sortedHistory = [...history].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

        for (const record of sortedHistory) {
            const effectiveDate = new Date(record.effective_date);
            if (effectiveDate <= periodEndDate) {
                return Number(record.amount);
            }
        }

        return Number(sortedHistory[sortedHistory.length - 1]?.amount ?? 0);
    };

    const openNewDialog = () => {
        window.open(route('employee-deductions.create') + '?employee_id=' + employee.id, '_blank');
    };

    const openPeriodEditPage = (periodKey: string) => {
        const [year, month] = periodKey.split('-');
        window.open(route('employee-deductions.edit') + '?employee_id=' + employee.id + '&month=' + month + '&year=' + year, '_blank');
    };

    const [deletingDeductionId, setDeletingDeductionId] = useState<number | null>(null);
    const [deletingPeriodKey, setDeletingPeriodKey] = useState<string | null>(null);

    const handleDeleteDeduction = (deductionId: number) => setDeletingDeductionId(deductionId);

    const performDeleteDeduction = (id: number) => {
        return router.delete(route('manage.employees.deductions.destroy', [employee.id, id]), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Deduction deleted successfully');
                setDeletingDeductionId(null);
            },
            onError: () => {
                toast.error('Failed to delete deduction');
            },
        });
    };

    const handlePrintDeductions = (periodKey: string) => {
        const [year, month] = periodKey.split('-');
        window.open(route('employees.print', [employee.id, { month, year, type: 'deductions' }]), '_blank');
    };

    const [editingDeduction, setEditingDeduction] = useState<EmployeeDeduction | null>(null);

    const periods = Array.isArray(periodsList) ? periodsList : [];
    const currentPage = pagination?.current_page ?? 1;
    const lastPage = pagination?.last_page ?? 1;

    const getClothingAllowancesForPeriod = (periodYear: number, periodMonth: number) => {
        if (!allClothingAllowances || allClothingAllowances.length === 0) return [];

        const periodStart = new Date(periodYear, periodMonth - 1, 1);
        const periodEnd = new Date(periodYear, periodMonth, 0);

        return allClothingAllowances.filter((ca) => {
            const startDate = new Date(ca.start_date);
            const endDate = ca.end_date ? new Date(ca.end_date) : null;

            return startDate <= periodEnd && (!endDate || endDate >= periodStart);
        });
    };

    const getClaimsForPeriod = (periodYear: number, periodMonth: number): Claim[] => {
        if (!allClaimsGrouped) return [];
        const key = `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
        const claims = allClaimsGrouped[key];
        return Array.isArray(claims) ? claims : [];
    };

    const getAdjustmentsForPeriod = (periodYear: number, periodMonth: number) => {
        if (!allAdjustmentsGrouped) return [];
        const key = `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
        const adjustments = allAdjustmentsGrouped[key];
        return Array.isArray(adjustments) ? adjustments : [];
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <CustomComboBox
                    items={MONTHS.map((month, index) => ({ value: String(index + 1), label: month }))}
                    placeholder="All Months"
                    value={filters.deduction_month ? String(filters.deduction_month) : null}
                    onSelect={(value) => applyFilter(value ?? undefined, filters.deduction_year)}
                />

                <CustomComboBox
                    items={availableYears.map((year) => ({ value: String(year), label: String(year) }))}
                    placeholder="All Years"
                    value={filters.deduction_year ? String(filters.deduction_year) : null}
                    onSelect={(value) => applyFilter(filters.deduction_month, value ?? undefined)}
                />

                {(filters.deduction_month || filters.deduction_year) && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-1 h-4 w-4" />
                        Clear
                    </Button>
                )}

                <div className="flex-1"></div>
                <Button onClick={openNewDialog}>
                    <Plus className="h-4 w-4" />
                    Add Deductions
                </Button>
            </div>

            {periods.length === 0 ? (
                <div className="text-muted-foreground rounded-sm border py-12 text-center text-sm">No deductions recorded yet.</div>
            ) : (
                <div className="space-y-4">
                    {periods.map((periodKey) => {
                        const [year, month] = periodKey.split('-');
                        const periodYear = parseInt(year);
                        const periodMonth = parseInt(month);
                        const periodDeductions = deductions[periodKey] ?? [];
                        const periodClothingAllowances = getClothingAllowancesForPeriod(periodYear, periodMonth);
                        const periodClaims = getClaimsForPeriod(periodYear, periodMonth);
                        const periodAdjustments = getAdjustmentsForPeriod(periodYear, periodMonth);
                        const totalDeductions = periodDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
                        const totalClothingAllowance = periodClothingAllowances.reduce((sum, ca) => sum + Number(ca.amount), 0);
                        const totalClaims = periodClaims.reduce((sum, c) => sum + Number(c.amount), 0);
                        const totalAdjustments = periodAdjustments.reduce((sum, adj) => {
                            const amt = Number(adj.amount);
                            return sum + (adj.adjustment_type === 'Deduction Refund' || amt < 0 ? amt : amt);
                        }, 0);

                        // Calculate gross pay using historical data for the specific period
                        const salary = getEffectiveAmount(employee.salaries, periodYear, periodMonth);
                        const pera = getEffectiveAmount(employee.peras, periodYear, periodMonth);
                        const rata = employee.is_rata_eligible ? getEffectiveAmount(employee.ratas, periodYear, periodMonth) : 0;
                        const grossPay = salary + pera + rata + totalClothingAllowance + totalClaims;
                        const netPay = grossPay - totalDeductions + totalAdjustments;

                        return (
                            <div key={periodKey} className="overflow-hidden rounded-sm border shadow-sm">
                                <div className="bg-muted/50 flex items-center justify-between px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default" className="text-md rounded-sm font-semibold">
                                            {MONTHS[parseInt(month) - 1]} {year}
                                        </Badge>
                                        <span className="text-muted-foreground text-xs">{periodDeductions.length} deduction(s)</span>
                                        {periodClothingAllowances.length > 0 && (
                                            <span className="text-muted-foreground text-xs">| {periodClothingAllowances.length} clothing</span>
                                        )}
                                        {periodClaims.length > 0 && (
                                            <span className="text-muted-foreground text-xs">| {periodClaims.length} claim(s)</span>
                                        )}
                                        {periodAdjustments.length > 0 && (
                                            <span className="text-muted-foreground text-xs">| {periodAdjustments.length} adj(s)</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="text-xs text-slate-500">Net Pay:</span>
                                            <span className="ml-2 text-sm font-bold text-green-600">{formatCurrency(netPay)}</span>
                                        </div>
                                        <Button variant="outline" onClick={() => handlePrintDeductions(periodKey)}>
                                            <Printer className="h-3 w-3" />
                                            Print
                                        </Button>
                                        <Button variant="outline" onClick={() => setDeletingPeriodKey(periodKey)}>
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                            Delete
                                        </Button>
                                        <Button variant="outline" onClick={() => openPeriodEditPage(periodKey)}>
                                            <PencilIcon className="h-3 w-3" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-muted-foreground text-xs">Basis</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="w-[60px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Clothing Allowances for this period */}
                                        {periodClothingAllowances.map((ca) => (
                                            <TableRow key={`ca-${ca.id}`} className="bg-blue-50">
                                                <TableCell className="font-medium text-blue-700">
                                                    Clothing Allowance
                                                    {ca.source_of_fund_code && (
                                                        <span className="ml-2 text-xs text-blue-500">({ca.source_of_fund_code.code})</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {new Date(ca.start_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                    {ca.end_date &&
                                                        ` - ${new Date(ca.end_date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}`}
                                                </TableCell>
                                                <TableCell className="text-right text-blue-600">+ {formatCurrency(Number(ca.amount))}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Claims for this period */}
                                        {periodClaims.map((c) => (
                                            <TableRow key={`claim-${c.id}`} className="bg-emerald-50">
                                                <TableCell className="font-medium text-emerald-700">Claim: {c.claim_type?.name ?? '—'}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {new Date(c.claim_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                    {c.reference_number && <span className="ml-1 text-[10px]">({c.reference_number})</span>}
                                                </TableCell>
                                                <TableCell className="text-right text-emerald-600">+ {formatCurrency(Number(c.amount))}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Adjustments for this period */}
                                        {periodAdjustments.map((adj) => (
                                            <TableRow key={`adj-${adj.id}`} className={Number(adj.amount) >= 0 ? 'bg-purple-50' : 'bg-orange-50'}>
                                                <TableCell
                                                    className={`font-medium ${Number(adj.amount) >= 0 ? 'text-purple-700' : 'text-orange-700'}`}
                                                >
                                                    Adj: {adj.adjustment_type?.name ?? adj.adjustment_type ?? '—'}
                                                    <span className="ml-1 text-xs">({adj.status})</span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {adj.adjustment_type?.name ?? adj.adjustment_type}
                                                    {adj.reason && <span className="ml-1">- {adj.reason}</span>}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right ${Number(adj.amount) >= 0 ? 'text-purple-600' : 'text-orange-600'}`}
                                                >
                                                    {Number(adj.amount) >= 0 ? '+' : ''}
                                                    {formatCurrency(Number(adj.amount))}
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        ))}
                                        {periodDeductions.map((d) => (
                                            <TableRow key={d.id}>
                                                <TableCell className="font-medium">{d.deduction_type?.name ?? '—'}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {d.salary ? (
                                                        <span>
                                                            {formatCurrency(Number(d.salary.amount))}
                                                            <span className="ml-1 text-[10px]">
                                                                (
                                                                {new Date(d.salary.effective_date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                })}
                                                                )
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">- {formatCurrency(Number(d.amount))}</TableCell>
                                                <TableCell className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-600 hover:text-slate-800"
                                                        onClick={() => setEditingDeduction(d)}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-500 hover:text-red-700"
                                                        onClick={() => handleDeleteDeduction(d.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-100 font-semibold">
                                            <TableCell colSpan={3} className="text-right text-xs text-slate-600">
                                                Basic Salary
                                            </TableCell>
                                            <TableCell className="text-right text-slate-700">{formatCurrency(salary)}</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-slate-100 font-semibold">
                                            <TableCell colSpan={2} className="text-right text-xs text-slate-600">
                                                PERA
                                            </TableCell>
                                            <TableCell className="text-right text-slate-700">+ {formatCurrency(pera)}</TableCell>
                                        </TableRow>
                                        {employee.is_rata_eligible && (
                                            <TableRow className="bg-slate-100 font-semibold">
                                                <TableCell colSpan={2} className="text-right text-xs text-slate-600">
                                                    RATA
                                                </TableCell>
                                                <TableCell className="text-right text-slate-700">+ {formatCurrency(rata)}</TableCell>
                                            </TableRow>
                                        )}
                                        {totalClothingAllowance > 0 && (
                                            <TableRow className="bg-blue-100 font-semibold">
                                                <TableCell colSpan={2} className="text-right text-xs text-blue-700">
                                                    Clothing Allowance
                                                </TableCell>
                                                <TableCell className="text-right text-blue-700">+ {formatCurrency(totalClothingAllowance)}</TableCell>
                                            </TableRow>
                                        )}
                                        {totalClaims > 0 && (
                                            <TableRow className="bg-emerald-100 font-semibold">
                                                <TableCell colSpan={2} className="text-right text-xs text-emerald-700">
                                                    Claims
                                                </TableCell>
                                                <TableCell className="text-right text-emerald-700">+ {formatCurrency(totalClaims)}</TableCell>
                                            </TableRow>
                                        )}
                                        {totalAdjustments !== 0 && (
                                            <TableRow
                                                className={totalAdjustments >= 0 ? 'bg-purple-100 font-semibold' : 'bg-orange-100 font-semibold'}
                                            >
                                                <TableCell
                                                    colSpan={2}
                                                    className={`text-right text-xs ${totalAdjustments >= 0 ? 'text-purple-700' : 'text-orange-700'}`}
                                                >
                                                    Adjustments
                                                </TableCell>
                                                <TableCell className={`text-right ${totalAdjustments >= 0 ? 'text-purple-700' : 'text-orange-700'}`}>
                                                    {totalAdjustments >= 0 ? '+' : ''}
                                                    {formatCurrency(totalAdjustments)}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow className="bg-slate-200 font-bold">
                                            <TableCell colSpan={2} className="text-right text-xs text-slate-800">
                                                Gross Pay
                                            </TableCell>
                                            <TableCell className="text-right text-slate-900">{formatCurrency(grossPay)}</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-red-50 font-semibold">
                                            <TableCell colSpan={2} className="text-right text-xs text-red-600">
                                                Total Deductions
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">- {formatCurrency(totalDeductions)}</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-green-100 font-bold">
                                            <TableCell colSpan={2} className="text-right text-sm text-green-800">
                                                Net Pay
                                            </TableCell>
                                            <TableCell className="text-right text-green-700">{formatCurrency(netPay)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        );
                    })}
                </div>
            )}
            {pagination && (
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-muted-foreground text-sm">
                        Page {currentPage} of {lastPage} ({pagination.total} periods)
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                            Previous
                        </Button>
                        <Button variant="outline" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === lastPage}>
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete single deduction confirmation */}
            <ConfirmDeleteDialog
                isOpen={deletingDeductionId !== null}
                onClose={() => setDeletingDeductionId(null)}
                title="Delete Deduction"
                description={'Are you sure you want to delete this deduction? This action cannot be undone.'}
                onConfirm={() => {
                    if (deletingDeductionId) {
                        return performDeleteDeduction(deletingDeductionId);
                    }
                    return Promise.resolve();
                }}
            />

            {/* Edit single deduction dialog */}
            <EditDeductionDialog isOpen={!!editingDeduction} onClose={() => setEditingDeduction(null)} deduction={editingDeduction} />

            {/* Delete all deductions for period confirmation */}
            <ConfirmDeleteDialog
                isOpen={deletingPeriodKey !== null}
                onClose={() => setDeletingPeriodKey(null)}
                title="Delete All Deductions for Period"
                description={
                    deletingPeriodKey
                        ? `Are you sure you want to delete ALL deductions for ${(() => {
                              const [y, m] = deletingPeriodKey.split('-');
                              return `${MONTHS[parseInt(m) - 1]} ${y}`;
                          })()}? This cannot be undone.`
                        : ''
                }
                onConfirm={() => {
                    if (!deletingPeriodKey) return Promise.resolve();
                    const [y, m] = deletingPeriodKey.split('-');
                    return router.delete(route('manage.employees.deductions.destroyPeriod', [employee.id]), {
                        data: { pay_period_month: String(parseInt(m)), pay_period_year: y },
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success('Successfully deleted deductions for the period');
                            setDeletingPeriodKey(null);
                        },
                        onError: () => {
                            toast.error('Failed to delete deductions for the period');
                        },
                    });
                }}
            />
        </div>
    );
}
