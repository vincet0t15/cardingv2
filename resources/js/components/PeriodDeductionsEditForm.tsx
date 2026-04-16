import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { router, useForm } from '@inertiajs/react';
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

const currentYear = new Date().getFullYear();
const startYear = 2020;
const endYear = currentYear + 5;
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => String(startYear + i));

interface Props {
    setOpen: (open: boolean) => void;
    employee: Employee;
    deductionTypes: DeductionType[];
    defaultMonth: string;
    defaultYear: string;
    existingDeductions: EmployeeDeduction[];
    takenPeriods: string[];
}

export default function PeriodDeductionsEditForm({ setOpen, employee, deductionTypes, defaultMonth, defaultYear, existingDeductions }: Props) {
    const [salaryOption, setSalaryOption] = useState<'current' | 'previous'>('current');
    const [selectedSalaryId, setSelectedSalaryId] = useState<number | null>(null);

    const sortedSalaries = employee.salaries
        ? [...employee.salaries].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
        : [];
    const currentSalary = sortedSalaries.length > 0 ? sortedSalaries[0] : null;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);

    const formatDate = (date?: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getSalaryAmount = (salaryId: number | null): string => {
        if (salaryId === null && currentSalary) return String(currentSalary.amount);
        const salary = sortedSalaries.find((s) => s.id === salaryId);
        return salary ? String(salary.amount) : '0';
    };

    const getInitialData = () => ({
        pay_period_month: defaultMonth,
        pay_period_year: defaultYear,
        salary_id: existingDeductions.length > 0 && existingDeductions[0].salary_id ? existingDeductions[0].salary_id : null,
        salary_amount:
            existingDeductions.length > 0 && existingDeductions[0].salary_id
                ? getSalaryAmount(existingDeductions[0].salary_id)
                : currentSalary
                  ? String(currentSalary.amount)
                  : '0',
        deductions: deductionTypes.map((dt) => {
            const existing = existingDeductions.find((e) => e.deduction_type_id === dt.id);
            return { deduction_type_id: dt.id, amount: existing ? String(existing.amount) : '' };
        }),
    });

    const { data, setData, post, processing, reset } = useForm<{
        pay_period_month: string;
        pay_period_year: string;
        salary_id: number | null;
        salary_amount: string;
        deductions: { deduction_type_id: number; amount: string }[];
    }>(getInitialData());

    useEffect(() => {
        const initial = getInitialData();
        setData(initial);
        if (initial.salary_id) {
            setSalaryOption('previous');
            setSelectedSalaryId(Number(initial.salary_id));
        } else {
            setSalaryOption('current');
            setSelectedSalaryId(null);
        }
    }, []);

    const handleAmountChange = (index: number, value: string) => {
        const updated = [...data.deductions];
        updated[index] = { ...updated[index], amount: value };
        setData('deductions', updated);
    };

    const handleSalaryChange = (salaryId: number | null) => {
        setSelectedSalaryId(salaryId);
        setData('salary_id', salaryId ?? null);
        setData('salary_amount', getSalaryAmount(salaryId));
    };

    const salaryOptions = sortedSalaries.map((s) => ({
        value: String(s.id),
        label: `${formatCurrency(Number(s.amount))} - Effective: ${formatDate(s.effective_date)}`,
    }));

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        const existingMap = new Map<number, EmployeeDeduction>();
        for (const ex of existingDeductions) existingMap.set(ex.deduction_type_id, ex);

        const ops: Promise<any>[] = [];
        for (const d of data.deductions) {
            const amount = d.amount ?? '';
            if (!amount || parseFloat(amount) <= 0) continue;
            const existing = existingMap.get(d.deduction_type_id);
            if (existing) {
                ops.push(
                    new Promise((resolve, reject) => {
                        router.put(
                            route('employee-deductions.update', existing.id),

                            {
                                amount: amount,
                                pay_period_month: data.pay_period_month,
                                pay_period_year: data.pay_period_year,
                            },
                            {
                                preserveScroll: true,
                                onSuccess: () => {
                                    toast.success('Deduction updated');
                                    resolve(true);
                                },
                                onError: () => reject(false),
                            },
                        );
                    }),
                );
            } else {
                ops.push(
                    new Promise((resolve, reject) => {
                        router.post(
                            route('manage.employees.deductions.store', employee.id),
                            {
                                pay_period_month: data.pay_period_month,
                                pay_period_year: data.pay_period_year,
                                salary_id: data.salary_id ?? null,
                                deductions: [{ deduction_type_id: d.deduction_type_id, amount: d.amount }],
                            },
                            {
                                preserveScroll: true,
                                onSuccess: () => resolve(true),
                                onError: () => reject(false),
                            },
                        );
                    }),
                );
            }
        }

        try {
            await Promise.all(ops);
            toast.success('Deductions updated successfully');
            reset();
            setOpen(false);
        } catch (err) {
            toast.error('Failed to update deductions');
        }
    };

    return (
        <form onSubmit={onSubmit}>
            <DialogHeader>
                <DialogTitle>Edit Salary Deductions</DialogTitle>
                <DialogDescription>
                    Updating deductions for {employee.last_name}, {employee.first_name} —{' '}
                    {MONTHS.find((m) => m.value === data.pay_period_month)?.label} {data.pay_period_year}.
                </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <Label>Month</Label>
                    <CustomComboBox
                        items={MONTHS}
                        placeholder="Select month"
                        value={data.pay_period_month}
                        onSelect={(value) => setData('pay_period_month', value ?? '')}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label>Year</Label>
                    <CustomComboBox
                        items={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
                        placeholder="Select year"
                        value={data.pay_period_year}
                        onSelect={(value) => setData('pay_period_year', value ?? '')}
                    />
                </div>
            </div>

            {sortedSalaries.length > 1 && (
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
                                            {formatCurrency(Number(currentSalary.amount))} - Effective: {formatDate(currentSalary.effective_date)}
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
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : 'Save changes...'}
                </Button>
            </DialogFooter>
        </form>
    );
}
