import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';
import { CustomComboBox } from '@/components/CustomComboBox';
import EditDeductionDialog from '@/components/EditDeductionDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DeductionType } from '@/types/deductionType';
import type { Employee, Employee as EmployeeType } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { router } from '@inertiajs/react';
import { PencilIcon, Plus, Printer, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import PeriodDeductionsDialog from './PeriodDeductionsDialog';

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
}: CompensationDeductionsProps) {
    // Use offices-style edit dialog state for period edit
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editDialogData, setEditDialogData] = useState<{
        month: string;
        year: string;
        existingDeductions: EmployeeDeduction[];
    } | null>(null);

    const goToPage = (page: number) => {
        router.get(
            route('manage.employees.index', employee.id),
            { deduction_page: page, deduction_month: filters.deduction_month, deduction_year: filters.deduction_year },
            { preserveState: true, preserveScroll: true },
        );
    };

    const applyFilter = (month: string | undefined, year: string | undefined) => {
        router.get(
            route('manage.employees.index', employee.id),
            { deduction_month: month, deduction_year: year },
            { preserveState: true, preserveScroll: true },
        );
    };

    const clearFilters = () => {
        router.get(route('manage.employees.index', employee.id), {}, { preserveState: true, preserveScroll: true });
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);

    // Helper function to get the effective amount for a specific period
    const getEffectiveAmount = (
        history: { amount: number; effective_date: string }[] | undefined,
        periodYear: number,
        periodMonth: number,
    ): number => {
        if (!history || history.length === 0) return 0;

        // Create a date for the end of the period (last day of the month)
        const periodEndDate = new Date(periodYear, periodMonth, 0); // Day 0 of next month = last day of current month

        // Sort history by effective_date descending (newest first)
        const sortedHistory = [...history].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

        // Find the most recent record that was effective before or during this period
        for (const record of sortedHistory) {
            const effectiveDate = new Date(record.effective_date);
            if (effectiveDate <= periodEndDate) {
                return Number(record.amount);
            }
        }

        // If no record found, return the oldest one (fallback)
        return Number(sortedHistory[sortedHistory.length - 1]?.amount ?? 0);
    };

    const openNewDialog = () => {
        // Open add deduction page in new tab
        window.open(route('employee-deductions.create') + '?employee_id=' + employee.id, '_blank');
    };

    const openPeriodEditDialog = (periodKey: string) => {
        const [year, month] = periodKey.split('-');
        setEditDialogData({ month: String(parseInt(month)), year, existingDeductions: deductions[periodKey] ?? [] });
        setOpenEditDialog(true);
    };

    const closePeriodEditDialog = () => {
        setOpenEditDialog(false);
        setEditDialogData(null);
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

    const periods = periodsList;
    const currentPage = pagination?.current_page ?? 1;
    const lastPage = pagination?.last_page ?? 1;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <CustomComboBox
                    items={MONTHS.map((month, index) => ({ value: String(index + 1), label: month }))}
                    placeholder="All Months"
                    value={filters.deduction_month ?? null}
                    onSelect={(value) => applyFilter(value ?? undefined, filters.deduction_year)}
                />

                <CustomComboBox
                    items={availableYears.map((year) => ({ value: String(year), label: String(year) }))}
                    placeholder="All Years"
                    value={filters.deduction_year ?? null}
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
                        const totalDeductions = periodDeductions.reduce((sum, d) => sum + Number(d.amount), 0);

                        // Calculate gross pay using historical data for the specific period
                        const salary = getEffectiveAmount(employee.salaries, periodYear, periodMonth);
                        const pera = getEffectiveAmount(employee.peras, periodYear, periodMonth);
                        const rata = employee.is_rata_eligible ? getEffectiveAmount(employee.ratas, periodYear, periodMonth) : 0;
                        const grossPay = salary + pera + rata;
                        const netPay = grossPay - totalDeductions;

                        return (
                            <div key={periodKey} className="overflow-hidden rounded-sm border shadow-sm">
                                <div className="bg-muted/50 flex items-center justify-between px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default" className="text-md rounded-sm font-semibold">
                                            {MONTHS[parseInt(month) - 1]} {year}
                                        </Badge>
                                        <span className="text-muted-foreground text-xs">{periodDeductions.length} deduction(s)</span>
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
                                        <Button variant="outline" onClick={() => openPeriodEditDialog(periodKey)}>
                                            <PencilIcon className="h-3 w-3" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow>
                                            <TableHead>Deduction Type</TableHead>
                                            <TableHead className="text-muted-foreground text-xs">Salary Basis</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="w-[60px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
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
            {openEditDialog && editDialogData && (
                <PeriodDeductionsDialog
                    open={openEditDialog}
                    setOpen={setOpenEditDialog}
                    employee={employee}
                    deductionTypes={deductionTypes}
                    defaultMonth={editDialogData.month}
                    defaultYear={editDialogData.year}
                    existingDeductions={editDialogData.existingDeductions}
                    takenPeriods={takenPeriods}
                />
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
