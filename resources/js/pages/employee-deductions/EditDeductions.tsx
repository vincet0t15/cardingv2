import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { Head, router, useForm } from '@inertiajs/react';
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

interface EditDeductionPageProps {
    employee: Employee;
    deductionTypes: DeductionType[];
    existingDeductions: EmployeeDeduction[];
    takenPeriods: string[];
}

export default function EditDeductionPage({ employee, deductionTypes, existingDeductions, takenPeriods }: EditDeductionPageProps) {
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

    const existingMap = new Map<number, EmployeeDeduction>();
    for (const ex of existingDeductions) {
        existingMap.set(ex.deduction_type_id, ex);
    }

    const getInitialPeriod = () => {
        if (existingDeductions.length > 0) {
            const first = existingDeductions[0];
            return {
                month: String(first.pay_period_month),
                year: String(first.pay_period_year),
            };
        }
        return {
            month: String(new Date().getMonth() + 1),
            year: String(new Date().getFullYear()),
        };
    };

    const initialPeriod = getInitialPeriod();

    const getInitialSalaryId = () => {
        if (existingDeductions.length > 0 && existingDeductions[0].salary_id) {
            return String(existingDeductions[0].salary_id);
        }
        return null;
    };

    const { data, setData, processing, reset } = useForm<{
        employee_id: number;
        pay_period_month: string;
        pay_period_year: string;
        salary_id: string | null;
        salary_amount: string;
        deductions: { deduction_type_id: number; amount: string }[];
    }>({
        employee_id: employee.id,
        pay_period_month: initialPeriod.month,
        pay_period_year: initialPeriod.year,
        salary_id: getInitialSalaryId(),
        salary_amount:
            existingDeductions.length > 0 && existingDeductions[0].salary_id
                ? getSalaryAmount(existingDeductions[0].salary_id)
                : currentSalary
                  ? String(currentSalary.amount)
                  : '0',
        deductions: deductionTypes.map((dt) => {
            const existing = existingMap.get(dt.id);
            return {
                deduction_type_id: dt.id,
                amount: existing ? String(existing.amount) : '',
            };
        }),
    });

    useEffect(() => {
        if (data.salary_id) {
            setSalaryOption('previous');
            setSelectedSalaryId(Number(data.salary_id));
        }
    }, [data.salary_id]);

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

    const salaryOptions = sortedSalaries.map((s) => ({
        value: String(s.id),
        label: `${formatCurrency(Number(s.amount))} - Effective: ${formatDate(s.effective_date)}`,
    }));

    const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        // Separate into creates and updates
        const toCreate: typeof data.deductions = [];
        const toUpdate: Array<{ id: number; amount: string }> = [];

        for (const d of data.deductions) {
            const amount = d.amount ?? '';
            if (!amount || parseFloat(amount) <= 0) continue;

            const existing = existingMap.get(d.deduction_type_id);
            if (existing) {
                toUpdate.push({ id: existing.id, amount });
            } else {
                toCreate.push(d);
            }
        }

        if (toCreate.length === 0 && toUpdate.length === 0) {
            toast.error('No valid deductions to save');
            return;
        }

        let successCount = 0;
        let failureCount = 0;
        const promises: Promise<void>[] = [];

        // Batch create request
        if (toCreate.length > 0) {
            promises.push(
                new Promise<void>((resolve) => {
                    router.post(
                        route('manage.employees.deductions.store', employee.id),
                        {
                            pay_period_month: data.pay_period_month,
                            pay_period_year: data.pay_period_year,
                            salary_id: data.salary_id ?? null,
                            deductions: toCreate,
                        },
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                successCount += toCreate.length;
                                resolve();
                            },
                            onError: () => {
                                failureCount += toCreate.length;
                                resolve();
                            },
                        },
                    );
                }),
            );
        }

        // Parallel update requests
        for (const update of toUpdate) {
            promises.push(
                new Promise<void>((resolve) => {
                    router.put(
                        route('employee-deductions.update', update.id),
                        {
                            amount: update.amount,
                            pay_period_month: data.pay_period_month,
                            pay_period_year: data.pay_period_year,
                        },
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                successCount += 1;
                                resolve();
                            },
                            onError: () => {
                                failureCount += 1;
                                resolve();
                            },
                        },
                    );
                }),
            );
        }

        // Execute all requests in parallel
        await Promise.all(promises);

        // Show results
        if (successCount > 0 && failureCount === 0) {
            toast.success(`${successCount} deduction(s) saved successfully`);
            router.get(route('manage.employees.index', employee.id));
        } else if (successCount > 0 && failureCount > 0) {
            toast.warning(`${successCount} saved, ${failureCount} failed`);
        } else if (failureCount > 0) {
            toast.error(`Failed to save ${failureCount} deduction(s)`);
        }
    };

    const handleCancel = () => {
        router.get(route('manage.employees.index', employee.id));
    };

    return (
        <AppLayout>
            <Head title={`Edit Deductions - ${MONTHS.find((m) => m.value === data.pay_period_month)?.label} ${data.pay_period_year}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-md p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Salary Deductions</h2>
                        <p className="text-muted-foreground mt-1">
                            Editing deductions for {employee.last_name}, {employee.first_name} —{' '}
                            {MONTHS.find((m) => m.value === data.pay_period_month)?.label} {data.pay_period_year}
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleCancel}>
                        Back to Employee
                    </Button>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="rounded-md border p-6 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    {sortedSalaries.length > 1 && (
                        <div className="rounded-md border p-6 shadow-sm">
                            <Label className="mb-3 block text-base font-semibold">Select Salary Basis</Label>
                            <p className="text-muted-foreground mb-4 text-sm">Select which salary record to use as reference for these deductions</p>
                            <div className="space-y-4">
                                <label
                                    htmlFor="current-salary"
                                    className="hover:bg-muted/50 flex cursor-pointer items-start space-x-3 rounded-md border p-4"
                                >
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
                                <label
                                    htmlFor="previous-salary"
                                    className="hover:bg-muted/50 flex cursor-pointer items-start space-x-3 rounded-md border p-4"
                                >
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

                    <div className="rounded-md border p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Deduction Amounts</h3>
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

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
