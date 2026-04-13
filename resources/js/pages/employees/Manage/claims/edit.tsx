import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Claim } from '@/types/claim';
import type { ClaimType } from '@/types/claimType';
import type { Employee } from '@/types/employee';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface EditClaimDialogProps {
    open: boolean;
    onClose: () => void;
    employee: Employee;
    claim: Claim;
    claimTypes: ClaimType[];
}

export function EditClaimDialog({ open, onClose, employee, claim, claimTypes }: EditClaimDialogProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        claim_type_id: String(claim.claim_type_id),
        claim_date: claim.claim_date,
        amount: String(claim.amount),
        purpose: claim.purpose,
        remarks: claim.remarks || '',
    });

    useEffect(() => {
        if (open) {
            setData({
                claim_type_id: String(claim.claim_type_id),
                claim_date: claim.claim_date,
                amount: String(claim.amount),
                purpose: claim.purpose,
                remarks: claim.remarks || '',
            });
        }
    }, [open, claim]);

    const claimTypeItems = claimTypes.map((t) => ({ value: String(t.id), label: t.name }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('manage.employees.claims.update', [employee.id, claim.id]), {
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
                    <DialogTitle>Edit Claim</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
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
                            <Label htmlFor="edit_claim_date">Date *</Label>
                            <Input id="edit_claim_date" type="date" value={data.claim_date} onChange={(e) => setData('claim_date', e.target.value)} />
                            {errors.claim_date && <p className="text-sm text-red-500">{errors.claim_date}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit_amount">Amount *</Label>
                            <Input
                                id="edit_amount"
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
                            <Label htmlFor="edit_purpose">Purpose *</Label>
                            <Textarea
                                id="edit_purpose"
                                value={data.purpose}
                                onChange={(e) => setData('purpose', e.target.value)}
                                placeholder="Purpose of the claim"
                                rows={2}
                            />
                            {errors.purpose && <p className="text-sm text-red-500">{errors.purpose}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit_remarks">Remarks</Label>
                            <Textarea
                                id="edit_remarks"
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
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
