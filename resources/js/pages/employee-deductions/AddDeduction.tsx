import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import { Head, router, useForm } from '@inertiajs/react';
import { type FormEventHandler, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
    {
        title: 'Add Deductions',
        href: '/employee-deductions/add',
    },
];

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
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

interface AddDeductionPageProps {
    employee: Employee;
    deductionTypes: DeductionType[];
    takenPeriods: string[];
}

export default function AddDeductionPage({ employee, deductionTypes, takenPeriods }: AddDeductionPageProps) {
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
    const { data, setData, post, processing, reset } = useForm<{
        employee_id: number;
        pay_period_month: string;
        pay_period_year: string;
        salary_id: string | null;
        salary_amount: string;
        deductions: { deduction_type_id: number; amount: string }[];
    }>({
        employee_id: employee.id,
        pay_period_month: String(new Date().getMonth() + 1),
        pay_period_year: String(new Date().getFullYear()),
        salary_id: null,
        salary_amount: currentSalary ? String(currentSalary.amount) : '0',
        deductions: deductionTypes.map((dt) => ({
            deduction_type_id: dt.id,
            amount: '',
        })),
    });

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

    // Check if period has existing deductions
    const selectedPeriodKey = `${data.pay_period_year}-${String(data.pay_period_month).padStart(2, '0')}`;
    const isPeriodTaken = takenPeriods.includes(selectedPeriodKey);

    // Get the salary options for the dropdown
    const salaryOptions = sortedSalaries.map((s) => ({
        value: String(s.id),
        label: `${formatCurrency(Number(s.amount))} - Effective: ${new Date(s.effective_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}`,
    }));

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        if (isPeriodTaken) {
            toast.error(`Deductions for this period already exist.`);
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
                // Navigate back to employee manage page
                router.get(route('manage.employees.index', employee.id));
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(firstError || 'Failed to save deductions.');
            },
        });
    };

    const handleCancel = () => {
        router.get(route('manage.employees.index', employee.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Deductions" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-md p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Add Salary Deductions</h2>
                        <p className="text-muted-foreground mt-1">
                            Enter deductions for {employee.last_name}, {employee.first_name} {employee.middle_name}
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleCancel}>
                        Back to Employee
                    </Button>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="rounded-md border p-6 shadow-sm">
                        {/* Pay Period */}
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

                        {/* Period conflict warning */}
                        {isPeriodTaken && (
                            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Deductions for{' '}
                                <strong>
                                    {MONTHS.find((m) => m.value === data.pay_period_month)?.label} {data.pay_period_year}
                                </strong>{' '}
                                already exist. Please select a different period.
                            </div>
                        )}
                    </div>

                    {/* Salary Selection */}
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
                                                    {new Date(currentSalary.effective_date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
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
                                            <div className="mt-3">
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

                    {/* Salary Reference Display (when only one salary exists) */}
                    {sortedSalaries.length <= 1 && currentSalary && (
                        <div className="rounded-md border p-6 shadow-sm">
                            <h3 className="mb-2 text-base font-semibold">Salary Reference</h3>
                            <div className="bg-muted/50 rounded-md p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Current Salary</p>
                                        <p className="text-muted-foreground text-xs">
                                            Effective:{' '}
                                            {new Date(currentSalary.effective_date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold">{formatCurrency(Number(currentSalary.amount))}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deduction Fields */}
                    <div className="rounded-md border p-6 shadow-sm">
                        <h3 className="mb-4 text-base font-semibold">Deduction Amounts</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || isPeriodTaken}>
                            {processing ? 'Saving...' : 'Save Deductions'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
