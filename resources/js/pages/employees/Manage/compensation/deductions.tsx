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
import { router, usePage } from '@inertiajs/react';
import { PencilIcon, Plus, Printer, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    const { props } = usePage();
    const [lastFlashMessage, setLastFlashMessage] = useState<string | null>(null);

    // Watch for flash messages and show them as toasts
    useEffect(() => {
        const flashMessage = (props.flash as any)?.success;
        if (flashMessage && flashMessage !== lastFlashMessage) {
            toast.success(flashMessage);
            setLastFlashMessage(flashMessage);
        }
    }, [props.flash, lastFlashMessage]);
    const goToPage = (page: number) => {
        router.get(
            route('manage.employees.index', employee.id),
            {
                tab: 'deductions',
                deduction_page: page,
                deduction_month: filters.deduction_month,
                deduction_year: filters.deduction_year,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const applyFilter = (month: string | undefined, year: string | undefined) => {
        const params: Record<string, string> = { tab: 'deductions' };
        if (month) params.deduction_month = month;
        if (year) params.deduction_year = year;
        router.get(route('manage.employees.index', employee.id), params, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        router.get(route('manage.employees.index', employee.id), { tab: 'deductions' }, { preserveState: true, preserveScroll: true });
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

    const openPeriodEditPage = (periodKey: string, salaryId: string | number | null) => {
        const [year, month] = periodKey.split('-');
        const salaryParam = salaryId === null ? 'null' : salaryId;
        window.open(
            route('employee-deductions.edit') + '?employee_id=' + employee.id + '&month=' + month + '&year=' + year + '&salary_id=' + salaryParam,
            '_blank',
        );
    };

    const [deletingDeductionId, setDeletingDeductionId] = useState<number | null>(null);
    const [deletingPeriodKey, setDeletingPeriodKey] = useState<string | null>(null);

    const handleDeleteDeduction = (deductionId: number) => setDeletingDeductionId(deductionId);

    const performDeleteDeduction = (id: number) => {
        return router.delete(route('manage.employees.deductions.destroy', [employee.id, id]), {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingDeductionId(null);
            },
            onError: () => {
                toast.error('Failed to delete deduction');
            },
        });
    };

    const handlePrintDeductions = (periodKey: string, salaryId?: string | number | null) => {
        const [year, month] = periodKey.split('-');
        const params: Record<string, any> = { month, year, type: 'deductions' };
        if (salaryId !== undefined) {
            // Use 'null' string for NULL salary_id, otherwise use the actual ID
            params.salary_id = salaryId === null ? 'null' : salaryId;
        }
        window.open(route('employees.print', [employee.id, params]), '_blank');
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

    const groupDeductionsBySalary = (deductionList: EmployeeDeduction[]) => {
        const grouped = new Map<string | number, { salaryId: string | number | null; salary: any; deductions: EmployeeDeduction[] }>();

        deductionList.forEach((d) => {
            const salaryId = d.salary_id ?? 'no-salary';
            if (!grouped.has(salaryId)) {
                grouped.set(salaryId, {
                    salaryId: d.salary_id ?? null,
                    salary: d.salary ?? null,
                    deductions: [],
                });
            }
            grouped.get(salaryId)!.deductions.push(d);
        });

        return Array.from(grouped.values());
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

                        // Calculate gross pay using historical data for the specific period
                        const salary = getEffectiveAmount(employee.salaries, periodYear, periodMonth);
                        const pera = getEffectiveAmount(employee.peras, periodYear, periodMonth);
                        const rata = employee.is_rata_eligible ? getEffectiveAmount(employee.ratas, periodYear, periodMonth) : 0;

                        {
                            /* Salary-Grouped Deduction Cards - Each with its own header */
                        }
                        return groupDeductionsBySalary(periodDeductions).map((group) => {
                            const salaryAmount = group.salary ? Number(group.salary.amount) : salary;
                            const salaryLabel = group.salary
                                ? `${formatCurrency(Number(group.salary.amount))} (${new Date(group.salary.effective_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
                                : `${formatCurrency(salaryAmount)} (Current)`;
                            const salaryDeductions = group.deductions.reduce((sum, d) => sum + Number(d.amount), 0);
                            const salaryGrossPay = salaryAmount + pera + (employee.is_rata_eligible ? rata : 0);
                            const salaryNetPay = salaryGrossPay - salaryDeductions;
                            const salaryClothingAllowance = periodClothingAllowances.reduce((sum, ca) => sum + Number(ca.amount), 0);
                            const salaryTotalClaims = periodClaims.reduce((sum, c) => sum + Number(c.amount), 0);
                            const salaryTotalAdjustments = periodAdjustments.reduce((sum, adj) => {
                                const amt = Number(adj.amount);
                                return sum + (adj.adjustment_type === 'Deduction Refund' || amt < 0 ? amt : amt);
                            }, 0);

                            return (
                                <div key={`${periodKey}-salary-${group.salaryId}`} className="overflow-hidden rounded-sm border shadow-sm">
                                    <div className="bg-muted/50 flex items-center justify-between px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default" className="text-md rounded-sm font-semibold">
                                                {MONTHS[parseInt(month) - 1]} {year}
                                            </Badge>
                                            <span className="text-muted-foreground text-xs">{group.deductions.length} deduction(s)</span>
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
                                            <div className="text-right text-xs text-slate-600">
                                                Salary: <span className="font-semibold text-slate-800">{salaryLabel}</span>
                                            </div>
                                            <Button variant="outline" onClick={() => handlePrintDeductions(periodKey, group.salaryId)}>
                                                <Printer className="h-3 w-3" />
                                                Print
                                            </Button>
                                            <Button variant="outline" onClick={() => setDeletingPeriodKey(periodKey)}>
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                                Delete
                                            </Button>
                                            <Button variant="outline" onClick={() => openPeriodEditPage(periodKey, group.salaryId)}>
                                                <PencilIcon className="h-3 w-3" />
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden rounded-sm border shadow-sm">
                                        <div className="border-b bg-blue-50 px-4 py-2">
                                            <p className="text-sm font-semibold text-blue-900">Deductions & Summary</p>
                                        </div>
                                        <Table className="rounded-t-none">
                                            <TableHeader className="bg-muted/20">
                                                <TableRow>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead className="w-[100px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {group.deductions.map((d) => (
                                                    <TableRow key={d.id}>
                                                        <TableCell className="font-medium">{d.deduction_type?.name ?? '—'}</TableCell>
                                                        <TableCell className="text-right text-red-600">
                                                            - {formatCurrency(Number(d.amount))}
                                                        </TableCell>
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
                                                <TableRow className="bg-muted/30 font-semibold">
                                                    <TableCell>Subtotal (This Salary)</TableCell>
                                                    <TableCell className="text-right">- {formatCurrency(salaryDeductions)}</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                <TableRow className="bg-slate-100 font-semibold">
                                                    <TableCell className="text-xs text-slate-600">Basic Salary</TableCell>
                                                    <TableCell className="text-right text-slate-700">{formatCurrency(salaryAmount)}</TableCell>
                                                </TableRow>
                                                <TableRow className="bg-slate-100 font-semibold">
                                                    <TableCell className="text-xs text-slate-600">PERA</TableCell>
                                                    <TableCell className="text-right text-slate-700">+ {formatCurrency(pera)}</TableCell>
                                                </TableRow>
                                                {employee.is_rata_eligible && (
                                                    <TableRow className="bg-slate-100 font-semibold">
                                                        <TableCell className="text-xs text-slate-600">RATA</TableCell>
                                                        <TableCell className="text-right text-slate-700">+ {formatCurrency(rata)}</TableCell>
                                                    </TableRow>
                                                )}
                                                <TableRow className="bg-slate-200 font-bold">
                                                    <TableCell className="text-sm text-slate-800">Gross Pay</TableCell>
                                                    <TableCell className="text-right text-slate-900">{formatCurrency(salaryGrossPay)}</TableCell>
                                                </TableRow>
                                                <TableRow className="bg-red-50 font-semibold">
                                                    <TableCell className="text-xs text-red-600">Total Deductions</TableCell>
                                                    <TableCell className="text-right text-red-600">- {formatCurrency(salaryDeductions)}</TableCell>
                                                </TableRow>
                                                <TableRow className="bg-green-100 font-bold">
                                                    <TableCell className="text-sm text-green-800">Net Pay</TableCell>
                                                    <TableCell className="text-right text-green-700">{formatCurrency(salaryNetPay)}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            );
                        });
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
