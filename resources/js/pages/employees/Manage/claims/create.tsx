import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ClaimType } from '@/types/claimType';
import type { Employee } from '@/types/employee';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface CreateClaimDialogProps {
    open: boolean;
    onClose: () => void;
    employee: Employee;
    claimTypes: ClaimType[];
}

export function CreateClaimDialog({ open, onClose, employee, claimTypes }: CreateClaimDialogProps) {
    const [salaryOption, setSalaryOption] = useState<'current' | 'previous'>('current');
    const [selectedSalaryId, setSelectedSalaryId] = useState<number | null>(null);

    // Get current salary from employee data
    const currentSalary = employee.salaries && employee.salaries.length > 0 ? Number(employee.salaries[0].amount) : 0;

    // Format currency helper
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);

    const { data, setData, post, processing, errors, reset } = useForm({
        salary_id: null as number | null,
        claim_type_id: '',
        claim_date: new Date().toISOString().split('T')[0],
        amount: '',
        purpose: '',
        remarks: '',
    });

    useEffect(() => {
        if (open) {
            setSalaryOption('current');
            setSelectedSalaryId(null);
            setData('salary_id', null);
        }
    }, [open]);

    const claimTypeItems = claimTypes.map((t) => ({ value: String(t.id), label: t.name }));

    const handleSalaryChange = (salaryId: number | null) => {
        setSelectedSalaryId(salaryId);
        setData('salary_id', salaryId);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('manage.employees.claims.store', employee.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Claim</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Salary Selection */}
                        <div className="rounded-md border p-4">
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
                                            {currentSalary > 0 ? `Using current salary: ${formatCurrency(currentSalary)}` : 'No current salary found'}
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
                                        onChange={() => setSalaryOption('previous')}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium">Previous Salary</span>
                                        <p className="text-muted-foreground mt-1 text-sm">Select from salary history</p>
                                        {salaryOption === 'previous' && (
                                            <div className="mt-2 max-w-xs">
                                                <CustomComboBox
                                                    items={
                                                        employee.salaries
                                                            ?.filter((s) => s.id !== employee.salaries?.[0]?.id)
                                                            .map((s) => ({
                                                                value: String(s.id),
                                                                label: `${formatCurrency(Number(s.amount))} - Effective: ${new Date(s.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                                                            })) ?? []
                                                    }
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

                        <div className="grid gap-2">
                            <Label>Claim Type *</Label>
                            <CustomComboBox
                                items={claimTypeItems}
                                placeholder="Select claim type..."
                                value={data.claim_type_id || null}
                                onSelect={(value) => setData('claim_type_id', value ?? '')}
                            />
                            {errors.claim_type_id && <p className="text-sm text-red-500">{errors.claim_type_id}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="claim_date">Date *</Label>
                            <Input id="claim_date" type="date" value={data.claim_date} onChange={(e) => setData('claim_date', e.target.value)} />
                            {errors.claim_date && <p className="text-sm text-red-500">{errors.claim_date}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="purpose">Purpose *</Label>
                            <Textarea
                                id="purpose"
                                value={data.purpose}
                                onChange={(e) => setData('purpose', e.target.value)}
                                placeholder="Purpose of the claim"
                                rows={2}
                            />
                            {errors.purpose && <p className="text-sm text-red-500">{errors.purpose}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea
                                id="remarks"
                                value={data.remarks}
                                onChange={(e) => setData('remarks', e.target.value)}
                                placeholder="Optional remarks"
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
