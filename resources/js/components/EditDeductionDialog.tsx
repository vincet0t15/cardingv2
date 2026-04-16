import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface EditDeductionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    deduction: any | null;
}

export default function EditDeductionDialog({ isOpen, onClose, deduction }: EditDeductionDialogProps) {
    const { data, setData, put, processing, reset, errors } = useForm({ amount: '', notes: '' });

    useEffect(() => {
        if (deduction) {
            setData({ amount: String(deduction.amount ?? ''), notes: deduction.notes ?? '' });
        }
    }, [deduction]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!deduction) return;

        put(route('employee-deductions.update', deduction.id), {
            onSuccess: () => {
                toast.success('Deduction updated');
                reset();
                onClose();
            },
            onError: () => {
                toast.error('Failed to update deduction');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Edit Deduction</DialogTitle>
                    <DialogDescription>
                        {deduction ? <div className="text-sm">{deduction.deduction_type?.name ?? 'Deduction'}</div> : 'Edit deduction'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Amount</Label>
                        <Input type="number" step="0.01" min="0" value={data.amount} onChange={(e) => setData('amount', e.target.value)} />
                        <Label>Notes (optional)</Label>
                        <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" className="ml-2" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
