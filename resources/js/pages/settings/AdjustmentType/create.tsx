import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface CreateAdjustmentTypeDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateAdjustmentTypeDialog({ isOpen, onClose }: CreateAdjustmentTypeDialogProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        effect: 'positive',
        taxable: false,
        include_in_payroll: false,
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('adjustment-types.store'), {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Adjustment Type</DialogTitle>
                        <DialogDescription>Add a new adjustment type for payroll adjustments.</DialogDescription>
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
                            <CustomComboBox
                                items={[
                                    { value: 'positive', label: 'Positive (Adds to salary)' },
                                    { value: 'negative', label: 'Negative (Deducts from salary)' },
                                ]}
                                placeholder="Select effect"
                                value={data.effect}
                                onSelect={(v) => setData('effect', v ?? '')}
                                showClear={false}
                            />
                            {errors.effect && <p className="text-sm text-red-500">{errors.effect}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={data.taxable} onChange={(e) => setData('taxable', e.target.checked)} />
                                <span className="text-sm">Taxable</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.include_in_payroll}
                                    onChange={(e) => setData('include_in_payroll', e.target.checked)}
                                />
                                <span className="text-sm">Include in Payroll</span>
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
