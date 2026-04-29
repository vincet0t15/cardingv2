import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { AdjustmentType } from '@/types/adjustmentType';
import type { Employee } from '@/types/employee';
import type { ReferenceType } from '@/types/referenceType';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
    employees?: Employee[];
    adjustmentTypes?: AdjustmentType[];
    referenceTypes?: ReferenceType[];
    adjustment?: any;
    preSelectedEmployeeId?: string | null;
}

export default function Create({ employees = [], adjustmentTypes = [], referenceTypes = [], adjustment, preSelectedEmployeeId }: Props) {
    const isEdit = !!adjustment;

    // Dynamic breadcrumbs based on context
    const breadcrumbs: BreadcrumbItem[] = preSelectedEmployeeId
        ? [
              { title: 'Employees', href: '/employees' },
              { title: 'Employee Details', href: `/manage/employees/${preSelectedEmployeeId}` },
              { title: 'Add Adjustment', href: '/adjustments/create' },
          ]
        : [
              { title: 'Employees', href: '/employees' },
              { title: 'Add Adjustment', href: '/adjustments/create' },
          ];

    const { data, setData, post, put, processing, errors } = useForm({
        employee_id: adjustment?.employee_id?.toString() || preSelectedEmployeeId?.toString() || '',
        adjustment_type_id: adjustment?.adjustment_type_id?.toString() || '',
        amount: adjustment?.amount?.toString() || '',
        pay_period_month: adjustment?.pay_period_month?.toString() || (new Date().getMonth() + 1).toString(),
        pay_period_year: adjustment?.pay_period_year?.toString() || new Date().getFullYear().toString(),
        effectivity_date: adjustment?.effectivity_date || new Date().toISOString().split('T')[0],
        reference_id: adjustment?.reference_id || '',
        reference_type_id: adjustment?.reference_type_id?.toString() || '',
        reason: adjustment?.reason || '',
        remarks: adjustment?.remarks || '',
    });

    const returnToEmployeeManageUrl = preSelectedEmployeeId
        ? `${route('manage.employees.index', preSelectedEmployeeId)}?tab=adjustments`
        : adjustment && adjustment.employee_id
          ? route('employees.show', adjustment.employee_id)
          : `${route('manage.employees.index')}?tab=adjustments`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            put(route('adjustments.update', adjustment.id));
        } else {
            post(route('adjustments.store'));
        }
    };

    // CustomComboBox options from database
    const employeeOptions = employees.map((emp) => ({
        value: emp.id.toString(),
        label: `${emp.first_name} ${emp.last_name}`,
    }));

    const adjustmentTypeOptions = adjustmentTypes.map((type) => ({
        value: type.id.toString(),
        label: `${type.effect === 'positive' ? '↑' : '↓'} ${type.name}`,
    }));

    const referenceTypeOptions = referenceTypes.map((type) => ({
        value: type.id.toString(),
        label: type.name,
    }));

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Adjustment' : 'Create Adjustment'} />
            <div className="flex h-full w-full flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={returnToEmployeeManageUrl}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{isEdit ? 'Edit Adjustment' : 'Create Adjustment'}</h1>
                            <p className="text-sm text-slate-600">
                                {isEdit
                                    ? 'Update adjustment details'
                                    : preSelectedEmployeeId
                                      ? 'Add a new payroll adjustment for this employee'
                                      : 'Add a new payroll adjustment'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Form with Gradient Card */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Main Form Card with Gradient Background */}
                    <Card className="w-full border border-gray-300 bg-white/90 text-gray-800 placeholder-gray-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">Adjustment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Employee Selection - Only show if not pre-selected and not editing */}
                            {!preSelectedEmployeeId && !isEdit && (
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
                                    {errors.employee_id && <p className="text-sm text-red-300">{errors.employee_id}</p>}
                                </div>
                            )}

                            {/* Adjustment Type and Amount */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="adjustment_type_id" className="required">
                                        Adjustment Type
                                    </Label>
                                    <CustomComboBox
                                        items={adjustmentTypeOptions}
                                        placeholder="Select type"
                                        value={data.adjustment_type_id || null}
                                        onSelect={(value) => setData('adjustment_type_id', value || '')}
                                    />
                                    {errors.adjustment_type_id && <p className="text-sm text-red-300">{errors.adjustment_type_id}</p>}
                                </div>

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
                                    />
                                    {errors.amount && <p className="text-sm text-red-300">{errors.amount}</p>}
                                </div>
                            </div>

                            {/* Pay Period */}
                            <div className="mb-2 text-sm text-gray-600">
                                <strong className="text-gray-800">Pay Period</strong>: Piliin ang buwan at taon kung saan ilalagay ang adjustment sa
                                payroll (hal. April 2026).
                                <br />
                                <strong className="text-gray-800">Effectivity Date</strong>: Eksaktong petsa kung kailan magiging epektibo ang
                                adjustment (hal. 2026-04-15). Ito ang ginagamit para sa chronological ordering at kung kailan dapat i-apply ang
                                pagbabago.
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="pay_period_month" className="required">
                                        Month
                                    </Label>
                                    <CustomComboBox
                                        items={monthOptions}
                                        placeholder="Select month"
                                        value={data.pay_period_month || null}
                                        onSelect={(value) => setData('pay_period_month', value || '')}
                                    />
                                    {errors.pay_period_month && <p className="text-sm text-red-300">{errors.pay_period_month}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pay_period_year" className="required">
                                        Year
                                    </Label>
                                    <CustomComboBox
                                        items={yearOptions}
                                        placeholder="Select year"
                                        value={data.pay_period_year || null}
                                        onSelect={(value) => setData('pay_period_year', value || '')}
                                    />
                                    {errors.pay_period_year && <p className="text-sm text-red-300">{errors.pay_period_year}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="effectivity_date" className="required">
                                        Effectivity Date
                                    </Label>
                                    <Input
                                        id="effectivity_date"
                                        type="date"
                                        value={data.effectivity_date}
                                        onChange={(e) => setData('effectivity_date', e.target.value)}
                                    />
                                    {errors.effectivity_date && <p className="text-sm text-red-300">{errors.effectivity_date}</p>}
                                </div>
                            </div>

                            {/* Reference */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="reference_type_id">Reference Type</Label>
                                    <CustomComboBox
                                        items={referenceTypeOptions}
                                        placeholder="Select reference type"
                                        value={data.reference_type_id || null}
                                        onSelect={(value) => setData('reference_type_id', value || '')}
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
                                />
                                {errors.reason && <p className="text-sm text-red-300">{errors.reason}</p>}
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
                        </CardContent>
                    </Card>

                    {/* Sidebar - Summary/Actions */}
                    <div className="flex w-full max-w-[380px] flex-col gap-4 lg:col-span-1">
                        {/* Summary Card */}
                        <Card className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {data.amount && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-800">Amount:</span>
                                        <span className="font-semibold">
                                            {parseFloat(data.amount || '0').toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                                        </span>
                                    </div>
                                )}
                                {data.adjustment_type_id && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-800">Type:</span>
                                        <span className="font-semibold">
                                            {adjustmentTypeOptions.find((t) => t.value === data.adjustment_type_id)?.label}
                                        </span>
                                    </div>
                                )}
                                {data.pay_period_month && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-800">Period:</span>
                                        <span className="font-semibold">
                                            {monthOptions.find((m) => m.value === data.pay_period_month)?.label} {data.pay_period_year}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Actions Card */}
                        <Card className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <CardContent className="space-y-3 pt-4">
                                <Button type="submit" disabled={processing} className="w-full bg-gradient-to-r from-teal-600 to-cyan-600">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : isEdit ? 'Update Adjustment' : 'Create Adjustment'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-gray-300 bg-white/10 text-gray-800 hover:bg-white/20"
                                    asChild
                                >
                                    <Link href={returnToEmployeeManageUrl}>Cancel</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
