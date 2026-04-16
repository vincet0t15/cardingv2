import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AdjustmentType } from '@/types/adjustmentType';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface EditAdjustmentTypeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    adjustmentType: AdjustmentType;
    roles: string[];
}

export function EditAdjustmentTypeDialog({ isOpen, onClose, adjustmentType }: EditAdjustmentTypeDialogProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: adjustmentType.name,
        description: adjustmentType.description || '',
        effect: adjustmentType.effect,
        taxable: (adjustmentType as any).taxable ?? false,
        include_in_payroll: (adjustmentType as any).include_in_payroll ?? false,
        restricted_roles: (adjustmentType as any).restricted_roles ? (adjustmentType as any).restricted_roles.split(',') : [],
    });

    useEffect(() => {
        if (isOpen) {
            setData({
                name: adjustmentType.name,
                description: adjustmentType.description || '',
                effect: adjustmentType.effect,
                taxable: (adjustmentType as any).taxable ?? false,
                include_in_payroll: (adjustmentType as any).include_in_payroll ?? false,
                restricted_roles: (adjustmentType as any).restricted_roles ? (adjustmentType as any).restricted_roles.split(',') : [],
            });
        }
    }, [isOpen, adjustmentType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('adjustment-types.update', adjustmentType.id), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Adjustment Type</DialogTitle>
                        <DialogDescription>Update the adjustment type details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="required">
                                Name
                            </Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g., Salary Refund" />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Brief description of this adjustment type"
                                rows={3}
                            />
                            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="effect" className="required">
                                Effect
                            </Label>
                            <select
                                id="effect"
                                value={data.effect}
                                onChange={(e) => setData('effect', e.target.value as 'positive' | 'negative')}
                                className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                <option value="positive">Positive (Adds to salary)</option>
                                <option value="negative">Negative (Deducts from salary)</option>
                            </select>
                            {errors.effect && <p className="text-sm text-red-500">{errors.effect}</p>}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="restricted_roles">Restricted Roles</Label>
                        <select
                            id="restricted_roles"
                            multiple
                            value={data.restricted_roles}
                            onChange={(e) =>
                                setData(
                                    'restricted_roles',
                                    Array.from(e.target.selectedOptions).map((o) => o.value),
                                )
                            }
                            className="w-full rounded-md border px-3 py-2 text-sm"
                        >
                            {roles.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                        {errors.restricted_roles && <p className="text-sm text-red-500">{errors.restricted_roles}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
