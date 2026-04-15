import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Employee } from '@/types/employee';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, RefreshCcw, Save } from 'lucide-react';
interface Props {
    employees: Employee[];
    adjustment?: any;
}
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
    {
        title: 'Add Adjustment',
        href: '/employee-adjustments/add',
    },
];
export default function Create({ employees, adjustment }: Props) {
    const isEdit = !!adjustment;

    const { data, setData, post, put, processing, errors } = useForm({
        employee_id: adjustment?.employee_id?.toString() || '',
        adjustment_type: adjustment?.adjustment_type || '',
        amount: adjustment?.amount?.toString() || '',
        pay_period_month: adjustment?.pay_period_month?.toString() || (new Date().getMonth() + 1).toString(),
        pay_period_year: adjustment?.pay_period_year?.toString() || new Date().getFullYear().toString(),
        effectivity_date: adjustment?.effectivity_date || new Date().toISOString().split('T')[0],
        reference_id: adjustment?.reference_id || '',
        reference_type: adjustment?.reference_type || '',
        reason: adjustment?.reason || '',
        remarks: adjustment?.remarks || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            put(route('adjustments.update', adjustment.id));
        } else {
            post(route('adjustments.store'));
        }
    };

    // CustomComboBox options
    const employeeOptions = employees.map((emp) => ({
        value: emp.id.toString(),
        label: `${emp.first_name} ${emp.last_name}`,
    }));

    const adjustmentTypes = [
        { value: 'Salary Refund', label: '💰 Salary Refund' },
        { value: 'Underpayment', label: '📈 Underpayment' },
        { value: 'Overtime Adjustment', label: '⏰ Overtime Adjustment' },
        { value: 'Late Adjustment', label: '⏱️ Late Adjustment' },
        { value: 'Deduction Refund', label: '💸 Deduction Refund' },
        { value: 'Correction', label: '✏️ Correction' },
        { value: 'Absence Adjustment', label: '🚫 Absence Adjustment' },
        { value: 'Holiday Pay Adjustment', label: '🎉 Holiday Pay Adjustment' },
    ];

    const monthOptions = [
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

    const yearOptions = [
        { value: '2026', label: '2026' },
        { value: '2025', label: '2025' },
        { value: '2024', label: '2024' },
        { value: '2023', label: '2023' },
        { value: '2022', label: '2022' },
        { value: '2021', label: '2021' },
    ];

    const referenceTypeOptions = [
        { value: 'dtr', label: 'DTR' },
        { value: 'biometric', label: 'Biometric Record' },
        { value: 'payroll', label: 'Payroll Record' },
        { value: 'deduction', label: 'Deduction Record' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Adjustment' : 'Create Adjustment'} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-md p-4">
                {/* Header */}
                <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 p-6">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon" className="h-10 w-10">
                            <Link href={route('adjustments.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Adjustment' : 'Create New Adjustment'}</h1>
                            <p className="text-sm text-slate-600">
                                {isEdit ? 'Update adjustment details' : 'Add a new payroll adjustment for LGU biometric system'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCcw className="h-5 w-5 text-teal-600" />
                                Adjustment Details
                            </CardTitle>
                            <CardDescription>Fill in all required fields to create the adjustment</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Employee Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="employee_id" className="required">
                                    Employee
                                </Label>
                                <CustomComboBox
                                    items={employeeOptions}
                                    placeholder="Select employee"
                                    value={data.employee_id || null}
                                    onSelect={(value) => setData('employee_id', value || '')}
                                />
                                {errors.employee_id && <p className="text-sm text-red-500">{errors.employee_id}</p>}
                            </div>

                            {/* Adjustment Type */}
                            <div className="space-y-2">
                                <Label htmlFor="adjustment_type" className="required">
                                    Adjustment Type
                                </Label>
                                <CustomComboBox
                                    items={adjustmentTypes}
                                    placeholder="Select adjustment type"
                                    value={data.adjustment_type || null}
                                    onSelect={(value) => setData('adjustment_type', value || '')}
                                />
                                {errors.adjustment_type && <p className="text-sm text-red-500">{errors.adjustment_type}</p>}
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="required">
                                    Amount (₱)
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className={errors.amount ? 'border-red-500' : ''}
                                />
                                <p className="text-xs text-slate-500">Use negative (-) for deductions, positive (+) for refunds</p>
                                {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                            </div>

                            {/* Pay Period */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="pay_period_month" className="required">
                                        Pay Period Month
                                    </Label>
                                    <CustomComboBox
                                        items={monthOptions}
                                        placeholder="Select month"
                                        value={data.pay_period_month || null}
                                        onSelect={(value) => setData('pay_period_month', value || '')}
                                    />
                                    {errors.pay_period_month && <p className="text-sm text-red-500">{errors.pay_period_month}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pay_period_year" className="required">
                                        Pay Period Year
                                    </Label>
                                    <CustomComboBox
                                        items={yearOptions}
                                        placeholder="Select year"
                                        value={data.pay_period_year || null}
                                        onSelect={(value) => setData('pay_period_year', value || '')}
                                    />
                                    {errors.pay_period_year && <p className="text-sm text-red-500">{errors.pay_period_year}</p>}
                                </div>
                            </div>

                            {/* Effectivity Date */}
                            <div className="space-y-2">
                                <Label htmlFor="effectivity_date" className="required">
                                    Effectivity Date
                                </Label>
                                <Input
                                    id="effectivity_date"
                                    type="date"
                                    value={data.effectivity_date}
                                    onChange={(e) => setData('effectivity_date', e.target.value)}
                                    className={errors.effectivity_date ? 'border-red-500' : ''}
                                />
                                {errors.effectivity_date && <p className="text-sm text-red-500">{errors.effectivity_date}</p>}
                            </div>

                            {/* Reference */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="reference_type">Reference Type</Label>
                                    <CustomComboBox
                                        items={referenceTypeOptions}
                                        placeholder="Select reference type"
                                        value={data.reference_type || null}
                                        onSelect={(value) => setData('reference_type', value || '')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reference_id">Reference ID</Label>
                                    <Input
                                        id="reference_id"
                                        placeholder="e.g., DTR-2026-001"
                                        value={data.reference_id}
                                        onChange={(e) => setData('reference_id', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="required">
                                    Reason / Justification
                                </Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Provide detailed reason for this adjustment..."
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    rows={4}
                                    className={errors.reason ? 'border-red-500' : ''}
                                />
                                {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
                            </div>

                            {/* Remarks */}
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks (Optional)</Label>
                                <Textarea
                                    id="remarks"
                                    placeholder="Additional notes or comments..."
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    rows={3}
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 border-t pt-6">
                                <Button type="submit" disabled={processing} className="bg-gradient-to-r from-teal-600 to-cyan-600">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : isEdit ? 'Update Adjustment' : 'Create Adjustment'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('adjustments.index')}>Cancel</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
