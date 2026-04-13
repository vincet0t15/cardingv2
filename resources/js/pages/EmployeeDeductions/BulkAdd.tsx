import { CustomComboBox } from '@/components/CustomComboBox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Users } from 'lucide-react';
import { useState } from 'react';

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

interface BulkAddDeductionProps {
    employees: Employee[];
    deductionTypes: DeductionType[];
}

export default function BulkAddDeduction({ employees, deductionTypes }: BulkAddDeductionProps) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOffice, setSelectedOffice] = useState<string>('all');

    const form = useForm({
        employee_ids: [] as number[],
        deduction_type_id: '',
        amount: '',
        pay_period_month: String(currentMonth),
        pay_period_year: String(currentYear),
        notes: '',
    });

    // Get unique offices
    const offices = Array.from(new Map(employees.map((emp) => [emp.office?.id, emp.office])).values())
        .filter((office) => office)
        .sort((a, b) => a.name.localeCompare(b.name));

    // Filter employees based on search and office
    const filteredEmployees = employees.filter((emp) => {
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || emp.position?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOffice = selectedOffice === 'all' || emp.office_id?.toString() === selectedOffice;
        return matchesSearch && matchesOffice;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (form.data.employee_ids.length === 0) {
            alert('Please select at least one employee');
            return;
        }

        form.post(route('employee-deductions.bulk-store'), {
            onSuccess: () => {
                // Redirect back to employee deductions page
                router.visit(route('employees.index'));
            },
        });
    };

    const selectAllFiltered = () => {
        const allIds = filteredEmployees.map((emp) => emp.id);
        form.setData('employee_ids', allIds);
    };

    const deselectAll = () => {
        form.setData('employee_ids', []);
    };

    const toggleEmployee = (employeeId: number) => {
        const current = form.data.employee_ids;
        if (current.includes(employeeId)) {
            form.setData(
                'employee_ids',
                current.filter((id) => id !== employeeId),
            );
        } else {
            form.setData('employee_ids', [...current, employeeId]);
        }
    };

    const isEmployeeSelected = (employeeId: number) => {
        return form.data.employee_ids.includes(employeeId);
    };

    const breadcrumbs = [
        { title: 'Employees', href: '/employees' },
        { title: 'Bulk Add Deduction', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bulk Add Deduction" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.visit(route('employees.index'))}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Bulk Add Deduction</h1>
                            <p className="text-sm text-slate-600">Add the same deduction to multiple employees at once</p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                        {form.data.employee_ids.length} employee(s) selected
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Employee Selection */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Select Employees
                            </CardTitle>
                            <CardDescription>Choose the employees you want to add this deduction to</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search and Filter */}
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Search by name or position..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1"
                                />
                                <CustomComboBox
                                    items={[
                                        { value: 'all', label: 'All Offices' },
                                        ...offices.map((office) => ({ value: office.id.toString(), label: office.name })),
                                    ]}
                                    placeholder="All Offices"
                                    value={selectedOffice}
                                    onSelect={(value) => setSelectedOffice(value || 'all')}
                                />
                            </div>

                            {/* Select All / Deselect All */}
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>
                                    Select All Filtered ({filteredEmployees.length})
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                                    Deselect All
                                </Button>
                            </div>

                            {/* Employee List */}
                            <div className="max-h-[500px] overflow-y-auto rounded-md border">
                                <div className="space-y-1 p-2">
                                    {filteredEmployees.length === 0 ? (
                                        <div className="py-8 text-center text-slate-500">No employees found</div>
                                    ) : (
                                        filteredEmployees.map((employee) => {
                                            const fullName = `${employee.first_name} ${employee.last_name}`;
                                            const selected = isEmployeeSelected(employee.id);
                                            return (
                                                <div
                                                    key={employee.id}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-md p-3 transition-colors ${
                                                        selected ? 'border border-blue-200 bg-blue-50' : 'hover:bg-slate-50'
                                                    }`}
                                                    onClick={() => toggleEmployee(employee.id)}
                                                >
                                                    <Checkbox checked={selected} onCheckedChange={() => toggleEmployee(employee.id)} />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{fullName}</div>
                                                        <div className="text-xs text-slate-500">{employee.position || 'No Position'}</div>
                                                    </div>
                                                    {employee.office && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {employee.office.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">
                                    {form.data.employee_ids.length} of {employees.length} employees selected
                                </span>
                                {form.data.employee_ids.length > 0 && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Ready to add deduction</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deduction Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Deduction Details</CardTitle>
                            <CardDescription>Configure the deduction to be applied</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Deduction Type */}
                                <div className="space-y-2">
                                    <Label>
                                        Deduction Type <span className="text-red-500">*</span>
                                    </Label>
                                    <CustomComboBox
                                        items={deductionTypes.map((type) => ({ value: String(type.id), label: type.name }))}
                                        placeholder="Select deduction type"
                                        value={form.data.deduction_type_id}
                                        onSelect={(value) => form.setData('deduction_type_id', value || '')}
                                    />
                                    {form.errors.deduction_type_id && <p className="text-sm text-red-500">{form.errors.deduction_type_id}</p>}
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <Label>
                                        Amount <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={form.data.amount}
                                        onChange={(e) => form.setData('amount', e.target.value)}
                                    />
                                    {form.errors.amount && <p className="text-sm text-red-500">{form.errors.amount}</p>}
                                </div>

                                {/* Pay Period */}
                                <div className="space-y-2">
                                    <Label>
                                        Pay Period <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <CustomComboBox
                                            items={MONTHS}
                                            placeholder="Month"
                                            value={form.data.pay_period_month}
                                            onSelect={(value) => form.setData('pay_period_month', value || '')}
                                        />
                                        <CustomComboBox
                                            items={Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => ({
                                                value: String(year),
                                                label: String(year),
                                            }))}
                                            placeholder="Year"
                                            value={form.data.pay_period_year}
                                            onSelect={(value) => form.setData('pay_period_year', value || '')}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>Notes (Optional)</Label>
                                    <Textarea
                                        placeholder="e.g., Monthly GSIS deduction"
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                {/* Warning */}
                                <div className="flex gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-medium">Important:</p>
                                        <p>Duplicate deductions for the same employee, type, and period will be automatically skipped.</p>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button type="submit" className="w-full" disabled={form.processing || form.data.employee_ids.length === 0}>
                                    {form.processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="mr-2 h-4 w-4" />
                                            Add Deduction to {form.data.employee_ids.length} Employee(s)
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
