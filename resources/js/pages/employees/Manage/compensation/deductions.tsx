import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';
import { CustomComboBox } from '@/components/CustomComboBox';
import EditDeductionDialog from '@/components/EditDeductionDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/standard-table';
import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { router, usePage } from '@inertiajs/react';
import { PencilIcon, Plus, Printer, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    allEmployees?: Employee[];
    allClothingAllowances?: {
        id: number;
        amount: string | number;
        start_date: string;
        end_date: string | null;
        source_of_fund_code?: { code: string; description: string | null } | null;
    }[];
    allClaimsGrouped?: Record<string, any[]>;
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
    const [localFilters, setLocalFilters] = useState<{ deduction_month?: string; deduction_year?: string }>(filters);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync local state when filters prop changes
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // Watch for flash messages and show them as toasts
    useEffect(() => {
        const flashMessage = (props.flash as any)?.success;
        if (flashMessage && flashMessage !== lastFlashMessage) {
            toast.success(flashMessage);
            setLastFlashMessage(flashMessage);
        }
    }, [props.flash, lastFlashMessage]);

    // Memoize year options
    const yearOptions = useMemo(() =>
        availableYears.map((year) => ({ value: String(year), label: String(year) })),
        [availableYears]
    );

    // Debounced filter apply
    const applyFilter = useCallback((month: string | undefined, year: string | undefined) => {
        const newFilters = { ...localFilters };
        if (month !== undefined) {
            month ? (newFilters.deduction_month = month) : delete newFilters.deduction_month;
        }
        if (year !== undefined) {
            year ? (newFilters.deduction_year = year) : delete newFilters.deduction_year;
        }
        setLocalFilters(newFilters);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            const params: Record<string, string> = { tab: 'deductions' };
            if (month) params.deduction_month = month;
            if (year) params.deduction_year = year;
            router.get(route('manage.employees.index', employee.id), params, { preserveState: true, preserveScroll: true });
        }, 300);
    }, [localFilters, employee.id]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const clearFilters = useCallback(() => {
        setLocalFilters({});
        router.get(route('manage.employees.index', employee.id), { tab: 'deductions' }, { preserveState: true, preserveScroll: true });
    }, [employee.id]);

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
            params.salary_id = salaryId === null ? 'null' : salaryId;
        }
        window.open(route('employees.print', [employee.id, params]), '_blank');
    };

    const [editingDeduction, setEditingDeduction] = useState<EmployeeDeduction | null>(null);

    // Memoize periods
    const periods = useMemo(() => Array.isArray(periodsList) ? periodsList : [], [periodsList]);
    const currentPage = pagination?.current_page ?? 1;
    const lastPage = pagination?.last_page ?? 1;

    // ── Helper: get clothing allowances for a period ──
    const getClothingAllowancesForPeriod = useCallback((periodYear: number, periodMonth: number) => {
        if (!allClothingAllowances || allClothingAllowances.length === 0) return [];
        const periodStart = new Date(periodYear, periodMonth - 1, 1);
        const periodEnd = new Date(periodYear, periodMonth, 0);
        return allClothingAllowances.filter((ca) => {
            const startDate = new Date(ca.start_date);
            const endDate = ca.end_date ? new Date(ca.end_date) : null;
            return startDate <= periodEnd && (!endDate || endDate >= periodStart);
        });
    }, [allClothingAllowances]);

    // ── Helper: get hazard pays for a period ──
    const getHazardPaysForPeriod = useCallback((periodYear: number, periodMonth: number) => {
        if (!employee.hazard_pays || employee.hazard_pays.length === 0) return [];
        const periodStart = new Date(periodYear, periodMonth - 1, 1);
        const periodEnd = new Date(periodYear, periodMonth, 0);
        return employee.hazard_pays.filter((hp) => {
            const startDate = new Date(hp.start_date);
            const endDate = hp.end_date ? new Date(hp.end_date) : null;
            return startDate <= periodEnd && (!endDate || endDate >= periodStart);
        });
    }, [employee.hazard_pays]);

    // ── Helper: get adjustments for a period ──
    const getAdjustmentsForPeriod = useCallback((periodYear: number, periodMonth: number) => {
        if (!allAdjustmentsGrouped) return [];
        const key = `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
        const adjustments = allAdjustmentsGrouped[key];
        return Array.isArray(adjustments) ? adjustments : [];
    }, [allAdjustmentsGrouped]);

    // ── Helper: compute signed adjustment ──
    const computeSignedAdjustment = useCallback((adj: any) => {
        const amt = Number(adj.amount) || 0;
        const effect = (
            (adj.adjustmentType && adj.adjustmentType.effect) ||
            (typeof adj.adjustment_type === 'object' && adj.adjustment_type?.effect) ||
            adj.effect ||
            ''
        ).toString().toLowerCase();
        return effect.includes('neg') || effect === '-' || effect.includes('subtract') ? -amt : amt;
    }, []);

    const groupDeductionsBySalary = useCallback((deductionList: EmployeeDeduction[]) => {
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
    }, []);

    // Format currency memoized
    const formatCurrency = useCallback((amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount),
        []
    );

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <CustomComboBox
                    items={MONTHS.map((month, index) => ({ value: String(index + 1), label: month }))}
                    placeholder="All Months"
                    value={localFilters.deduction_month ? String(localFilters.deduction_month) : null}
                    onSelect={(value) => applyFilter(value ?? undefined, localFilters.deduction_year)}
                />

                <CustomComboBox
                    items={yearOptions}
                    placeholder="All Years"
                    value={localFilters.deduction_year ? String(localFilters.deduction_year) : null}
                    onSelect={(value) => applyFilter(localFilters.deduction_month, value ?? undefined)}
                />

                {(localFilters.deduction_month || localFilters.deduction_year) && (
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
                        const salary = getEffectiveAmount(employee.salaries, periodYear, periodMonth);

                        return groupDeductionsBySalary(periodDeductions).map((group) => {
                            const salaryAmount = group.salary ? Number(group.salary.amount) : salary;
                            const salaryLabel = group.salary
                                ? `${formatCurrency(Number(group.salary.amount))} (${new Date(group.salary.effective_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
                                : `${formatCurrency(salaryAmount)} (Current)`;
                            const salaryDeductions = group.deductions.reduce((sum, d) => sum + Number(d.amount), 0);

                            // ── Period summary calculations ──
                            const pera = getEffectiveAmount(employee.peras, periodYear, periodMonth);
                            const rata = employee.is_rata_eligible ? getEffectiveAmount(employee.ratas, periodYear, periodMonth) : 0;
                            const periodClothingAllowances = getClothingAllowancesForPeriod(periodYear, periodMonth);
                            const periodHazardPays = getHazardPaysForPeriod(periodYear, periodMonth);
                            const salaryClothingAllowance = periodClothingAllowances.reduce((sum, ca) => sum + Number(ca.amount), 0);
                            const salaryHazardPay = periodHazardPays.reduce((sum, hp) => sum + Number(hp.amount), 0);
                            const salaryGrossPay = salaryAmount + pera + rata + salaryHazardPay + salaryClothingAllowance;
                            const periodAdjustments = getAdjustmentsForPeriod(periodYear, periodMonth);
                            const salaryTotalAdjustments = periodAdjustments.reduce((sum, adj) => sum + computeSignedAdjustment(adj), 0);
                            const salaryNetPay = salaryGrossPay - salaryDeductions + salaryTotalAdjustments;

                            return (
                                <div key={`${periodKey}-salary-${group.salaryId}`} className="overflow-hidden rounded-md border shadow-sm">
                                    {/* --- Period & Actions Header --- */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-4 py-2.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="default" className="rounded-md px-3 py-1 text-sm font-semibold">
                                                {MONTHS[parseInt(month) - 1]} {year}
                                            </Badge>
                                            <span className="text-muted-foreground text-xs">
                                                {group.deductions.length} deduction{group.deductions.length !== 1 ? 's' : ''}
                                            </span>
                                            <span className="text-muted-foreground ml-2 hidden text-xs sm:inline">
                                                Salary: <span className="font-semibold text-slate-700">{salaryLabel}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Button variant="ghost" size="sm" className="h-8" onClick={() => handlePrintDeductions(periodKey, group.salaryId)}>
                                                <Printer className="mr-1 h-3.5 w-3.5" />
                                                Print
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8" onClick={() => openPeriodEditPage(periodKey, group.salaryId)}>
                                                <PencilIcon className="mr-1 h-3.5 w-3.5" />
                                                Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-700" onClick={() => setDeletingPeriodKey(periodKey)}>
                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>

                                    {/* --- Deductions Table (clean & focused) --- */}
                                    <div className="px-0">
                                        <Table className='rounded-b-none'>
                                            <TableHeader className="bg-slate-100">
                                                <TableRow>
                                                    <TableHead className="text-xs uppercase tracking-wider">Deduction Type</TableHead>
                                                    <TableHead className="w-36 text-right text-xs uppercase tracking-wider">Amount</TableHead>
                                                    <TableHead className="w-24 text-center text-xs uppercase tracking-wider">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {group.deductions.map((d) => (
                                                    <TableRow key={d.id} className="group hover:bg-slate-50">
                                                        <TableCell className="font-medium">{d.deduction_type?.name ?? '—'}</TableCell>
                                                        <TableCell className="text-right  text-red-600">
                                                            -{formatCurrency(Number(d.amount))}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-slate-500 hover:text-slate-800"
                                                                    onClick={() => setEditingDeduction(d)}
                                                                >
                                                                    <PencilIcon className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-red-400 hover:text-red-700"
                                                                    onClick={() => handleDeleteDeduction(d.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {/* Total row */}

                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* ── Payslip Summary ── */}
                                    <div className="border-t bg-white px-4 py-3">
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                                            <div className="text-muted-foreground col-span-2 mb-1 text-xs font-semibold uppercase tracking-wider">
                                                Payslip Summary
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Basic Salary</span>
                                                <span className="font-medium text-slate-800">{formatCurrency(salaryAmount)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>PERA</span>
                                                <span className="font-medium text-slate-800">+ {formatCurrency(pera)}</span>
                                            </div>
                                            {employee.is_rata_eligible && (
                                                <div className="flex justify-between text-slate-600">
                                                    <span>RATA</span>
                                                    <span className="font-medium text-slate-800">+ {formatCurrency(rata)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-slate-600">
                                                <span>Hazard Pay</span>
                                                <span className="font-medium text-slate-800">+ {formatCurrency(salaryHazardPay)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Clothing Allowance</span>
                                                <span className="font-medium text-slate-800">+ {formatCurrency(salaryClothingAllowance)}</span>
                                            </div>
                                            <div className="col-span-2 my-1 border-t border-dashed border-slate-300"></div>
                                            <div className="flex justify-between font-semibold text-slate-800">
                                                <span>Gross Pay</span>
                                                <span>{formatCurrency(salaryGrossPay)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Adjustments</span>
                                                <span className={salaryTotalAdjustments >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                    {salaryTotalAdjustments >= 0 ? '+ ' : '- '}
                                                    {formatCurrency(Math.abs(salaryTotalAdjustments))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-red-700">
                                                <span>Total Deductions</span>
                                                <span>-{formatCurrency(salaryDeductions)}</span>
                                            </div>
                                            <div className="col-span-2 my-1 border-t border-dashed border-slate-300"></div>
                                            <div className="col-span-2 flex justify-between text-base font-bold text-green-700">
                                                <span>Net Pay</span>
                                                <span>{formatCurrency(salaryNetPay)}</span>
                                            </div>
                                        </div>
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
