import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

const MONTHS = [
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

// Dynamic year range: fixed start year (2020) to current year + 5
const currentYear = new Date().getFullYear();
const startYear = 2020;
const endYear = currentYear + 5;
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => String(startYear + i));

interface SalaryDialogProps {
    open: boolean;
    onClose: () => void;
    employee: Employee;
    deductionTypes: DeductionType[];
    defaultMonth: string;
    defaultYear: string;
    existingDeductions: EmployeeDeduction[];
    takenPeriods: string[];
}

export function SalaryDialog({
    open,
    onClose,
    employee,
    deductionTypes,
    defaultMonth,
    defaultYear,
    existingDeductions,
    takenPeriods,
}: SalaryDialogProps) {
    const isEditing = existingDeductions.length > 0;
    const [salaryOption, setSalaryOption] = useState<'current' | 'previous'>('current');
    const [selectedSalaryId, setSelectedSalaryId] = useState<number | null>(null);

    // Get current salary from employee data (sorted by effective_date desc)
    const sortedSalaries = employee.salaries
        ? [...employee.salaries].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
        : [];
    const currentSalary = sortedSalaries.length > 0 ? sortedSalaries[0] : null;

    // Format currency helper
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);

    // Get the salary amount to use
    const getSalaryAmount = (salaryId: number | null): string => {
        if (salaryId === null && currentSalary) {
            return String(currentSalary.amount);
        }
        const salary = sortedSalaries.find((s) => s.id === salaryId);
        return salary ? String(salary.amount) : '0';
    };

    // Initialize form data
    const getInitialData = () => ({
        pay_period_month: defaultMonth,
        pay_period_year: defaultYear,
        salary_id: null as string | null,
        salary_amount: currentSalary ? String(currentSalary.amount) : '0',
        deductions: deductionTypes.map((dt) => {
            const existing = existingDeductions.find((e) => e.deduction_type_id === dt.id);
            return {
                deduction_type_id: dt.id,
                amount: existing ? String(existing.amount) : '',
            };
        }),
    });

    const { data, setData, post, processing, reset } = useForm<{
        pay_period_month: string;
        pay_period_year: string;
        salary_id: string | null;
        salary_amount: string;
        deductions: { deduction_type_id: number; amount: string }[];
    }>(getInitialData());

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            reset();
            setSalaryOption('current');
            setSelectedSalaryId(null);
        }
    }, [open]);

    const handleAmountChange = (index: number, value: string) => {
        const updated = [...data.deductions];
        updated[index] = { ...updated[index], amount: value };
        setData('deductions', updated);
    };

    const handleSalaryChange = (salaryId: number | null) => {
        setSelectedSalaryId(salaryId);
        setData('salary_id', salaryId ? String(salaryId) : null);
        setData('salary_amount', getSalaryAmount(salaryId));
    };

    // Check if period has existing deductions (for Add mode only)
    const selectedPeriodKey = `${data.pay_period_year}-${String(data.pay_period_month).padStart(2, '0')}`;
    const isPeriodTaken = !isEditing && takenPeriods.includes(selectedPeriodKey);

    // Get the salary options for the dropdown
    const salaryOptions = sortedSalaries.map((s) => ({
        value: String(s.id),
        label: `${formatCurrency(Number(s.amount))} - Effective: ${formatDate(s.effective_date)}`,
    }));

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        if (isPeriodTaken) {
            toast.error(`Deductions for this period already exist. Close this dialog and use the Edit button to update them.`);
            return;
        }

        // Check if at least one deduction has an amount
        const hasDeduction = data.deductions.some((d) => d.amount && parseFloat(d.amount) > 0);
        if (!hasDeduction) {
            toast.error('Please enter at least one deduction amount.');
            return;
        }

        post(route('manage.employees.deductions.store', employee.id), {
            onSuccess: () => {
                toast.success('Deductions saved successfully');
                reset();
                onClose();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(firstError || 'Failed to save deductions.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-h-[95vh] min-w-3xl overflow-y-auto">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Salary Deductions' : 'Add Salary Deductions'}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? `Updating deductions for ${employee.last_name}, ${employee.first_name} — ${MONTHS.find((m) => m.value === data.pay_period_month)?.label} ${data.pay_period_year}.`
                                : `Enter deductions for ${employee.last_name}, ${employee.first_name}.`}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Pay Period */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <Label>Month</Label>
                            <CustomComboBox
                                items={MONTHS}
                                placeholder="Select month"
                                value={data.pay_period_month}
                                onSelect={(value) => !isEditing && setData('pay_period_month', value ?? '')}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label>Year</Label>
                            <CustomComboBox
                                items={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
                                placeholder="Select year"
                                value={data.pay_period_year}
                                onSelect={(value) => !isEditing && setData('pay_period_year', value ?? '')}
                            />
                        </div>
                    </div>

                    {/* Salary Selection */}
                    {!isEditing && sortedSalaries.length > 1 && (
                        <div className="mt-4 rounded-md border p-4">
                            <Label className="mb-3 block">Select Salary Basis</Label>
                            <div className="space-y-3">
                                <label htmlFor="current-salary" className="flex cursor-pointer items-start space-x-3">
                                    <input
                                        type="radio"
                                        id="current-salary"
                                        name="salary-option"
                                        value="current"
                                        checked={salaryOption === 'current'}
                                        onChange={() => {
                                            setSalaryOption('current');
                                            handleSalaryChange(null);
                                        }}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium">Current Salary</span>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {currentSalary ? (
                                                <>
                                                    {formatCurrency(Number(currentSalary.amount))} - Effective:{' '}
                                                    {formatDate(currentSalary.effective_date)}
                                                </>
                                            ) : (
                                                'No salary found'
                                            )}
                                        </p>
                                    </div>
                                </label>
                                <label htmlFor="previous-salary" className="flex cursor-pointer items-start space-x-3">
                                    <input
                                        type="radio"
                                        id="previous-salary"
                                        name="salary-option"
                                        value="previous"
                                        checked={salaryOption === 'previous'}
                                        onChange={() => {
                                            setSalaryOption('previous');
                                            // Auto-select first previous salary
                                            if (sortedSalaries.length > 1) {
                                                handleSalaryChange(sortedSalaries[1].id);
                                            }
                                        }}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium">Previous Salary</span>
                                        <p className="text-muted-foreground mt-1 text-sm">Select from salary history</p>
                                        {salaryOption === 'previous' && (
                                            <div className="mt-2">
                                                <CustomComboBox
                                                    items={salaryOptions.length > 1 ? salaryOptions.slice(1) : salaryOptions}
                                                    placeholder="Select previous salary"
                                                    value={selectedSalaryId ? String(selectedSalaryId) : null}
                                                    onSelect={(value) => handleSalaryChange(value ? parseInt(value) : null)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Period conflict warning */}
                    {isPeriodTaken && (
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                            Deductions for{' '}
                            <strong>
                                {MONTHS.find((m) => m.value === data.pay_period_month)?.label} {data.pay_period_year}
                            </strong>{' '}
                            already exist. Close this dialog and use the <strong>Edit</strong> button on that period to update it.
                        </div>
                    )}

                    {/* Deduction Fields */}
                    <div className="mt-4">
                        <h4 className="mb-3 text-sm font-semibold">Deduction Amounts</h4>
                        <div className="grid grid-cols-3 gap-4">
                            {deductionTypes.map((deductionType, index) => (
                                <div key={deductionType.id} className="flex flex-col gap-1">
                                    <Label htmlFor={`deduction-${deductionType.id}`}>
                                        {deductionType.name}
                                        <span className="text-muted-foreground ml-1 text-xs">({deductionType.code})</span>
                                    </Label>
                                    <Input
                                        id={`deduction-${deductionType.id}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={data.deductions[index]?.amount ?? ''}
                                        onChange={(e) => handleAmountChange(index, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing || isPeriodTaken}>
                            {processing ? 'Saving...' : 'Save Deductions'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
