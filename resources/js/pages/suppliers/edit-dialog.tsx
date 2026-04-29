import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Supplier } from '@/types/supplier';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface EditSupplierDialogProps {
    supplier: Supplier | null;
    onClose: () => void;
}

export function EditSupplierDialog({ supplier, onClose }: EditSupplierDialogProps) {
    const { data, setData, put, processing, errors, reset } = useForm<{
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
        if (supplier) {
            setData({
                name: supplier.name,
                owner_name: supplier.owner_name || '',
                address: supplier.address || '',
                contact_number: supplier.contact_number || '',
                email: supplier.email || '',
                remarks: supplier.remarks || '',
                is_active: supplier.is_active,
            });
        }
    }, [supplier]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (supplier) {
            put(route('suppliers.update', supplier.id), {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    return (
        <Dialog open={!!supplier} onOpenChange={onClose}>
            <DialogContent className="min-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Supplier</DialogTitle>
                    <DialogDescription>Update the supplier details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit_name">Supplier Name *</Label>
                        <Input id="edit_name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit_owner_name">Owner Name</Label>
                        <Input
                            id="edit_owner_name"
                            value={data.owner_name}
                            onChange={(e) => setData('owner_name', e.target.value)}
                            placeholder="Enter owner name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit_address" className="flex items-center gap-2">
                            Address
                        </Label>
                        <Textarea id="edit_address" value={data.address} onChange={(e) => setData('address', e.target.value)} rows={3} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_contact_number" className="flex items-center gap-2">
                                Contact Number
                            </Label>
                            <Input id="edit_contact_number" value={data.contact_number} onChange={(e) => setData('contact_number', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_email">Email</Label>
                            <Input id="edit_email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit_remarks">Remarks</Label>
                        <Textarea id="edit_remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} rows={2} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="edit_is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked === true)}
                        />
                        <Label htmlFor="edit_is_active" className="cursor-pointer">
                            Active Supplier
                        </Label>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Update Supplier
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
