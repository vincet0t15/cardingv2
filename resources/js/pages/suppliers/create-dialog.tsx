import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface CreateSupplierDialogProps {
    open: boolean;
    onClose: () => void;
}

export function CreateSupplierDialog({ open, onClose }: CreateSupplierDialogProps) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        owner_name: string;
        address: string;
        contact_number: string;
        email: string;
        remarks: string;
        is_active: boolean;
    }>({
        name: '',
        owner_name: '',
        address: '',
        contact_number: '',
        email: '',
        remarks: '',
        is_active: true,
    });

    useEffect(() => {
        if (open) {
            reset();
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('suppliers.store'), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Supplier</DialogTitle>
                    <DialogDescription>Enter the supplier details below.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Supplier Name *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Enter supplier name"
                            required
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="owner_name">Owner Name</Label>
                        <Input
                            id="owner_name"
                            value={data.owner_name}
                            onChange={(e) => setData('owner_name', e.target.value)}
                            placeholder="Enter owner name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                            Address
                        </Label>
                        <Textarea
                            id="address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="Enter supplier address"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact_number" className="flex items-center gap-2">
                                Contact Number
                            </Label>
                            <Input
                                id="contact_number"
                                value={data.contact_number}
                                onChange={(e) => setData('contact_number', e.target.value)}
                                placeholder="e.g., 09123456789"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="supplier@email.com"
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                            id="remarks"
                            value={data.remarks}
                            onChange={(e) => setData('remarks', e.target.value)}
                            placeholder="Additional notes about the supplier"
                            rows={2}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked === true)} />
                        <Label htmlFor="is_active" className="cursor-pointer">
                            Active Supplier
                        </Label>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Save Supplier
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
