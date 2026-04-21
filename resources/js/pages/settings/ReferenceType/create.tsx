import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface CreateReferenceTypeDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateReferenceTypeDialog({ isOpen, onClose }: CreateReferenceTypeDialogProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('reference-types.store'), {
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
                        <DialogTitle>Create Reference Type</DialogTitle>
                        <DialogDescription>Add a new reference type for tracking adjustment sources.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="required">
                                Name
                            </Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g., Payroll" />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Brief description of this reference type"
                                rows={3}
                            />
                            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
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
