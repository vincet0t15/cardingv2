import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ClaimType, ClaimTypeForm } from '@/types/claimType';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface EditClaimTypeProps {
    open: boolean;
    isOpen: (open: boolean) => void;
    selectedType: ClaimType | null;
}
export function EditClaimType({ open, isOpen, selectedType }: EditClaimTypeProps) {
    const { data, setData, put, reset } = useForm<ClaimTypeForm>({
        name: selectedType?.name || '',
        code: selectedType?.code || '',
        description: selectedType?.description || '',
        is_active: selectedType?.is_active || false,
    });

    const handleUpdate = () => {
        put(route('claim-types.update', selectedType?.id), {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success);
                reset();
                isOpen(false);
            },
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleToggle = (checked: boolean) => {
        setData({ ...data, is_active: checked });
    };
    return (
        <Dialog open={open} onOpenChange={isOpen}>
            <form>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Claim Type</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input name="name" value={data.name} onChange={handleChange} placeholder="e.g., Medical Reimbursement" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="code">Code</Label>
                            <Input name="code" value={data.code} onChange={handleChange} placeholder="e.g., MEDICAL" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea name="description" value={data.description || ''} onChange={handleChange} placeholder="Optional description" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch name="is_active" checked={data.is_active} onCheckedChange={handleToggle} />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => isOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate}>Update</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    );
}
