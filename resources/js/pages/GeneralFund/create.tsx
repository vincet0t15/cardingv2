import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GeneralFundCreateRequest } from '@/types/generalFund';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import type { ChangeEventHandler, FormEventHandler } from 'react';
import { toast } from 'sonner';

interface CreateGeneralFundDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function GeneralFundCreateDialog({ open, setOpen }: CreateGeneralFundDialogProps) {
    const { data, setData, post, reset, errors, processing } = useForm<GeneralFundCreateRequest>({
        code: '',
        description: '',
        status: true,
    });

    const onChangeInput: ChangeEventHandler<HTMLInputElement> = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('general-funds.store'), {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success);
                setOpen(false);
                reset();
            },
        });
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
        }
        setOpen(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="rounded-md sm:max-w-sm">
                <form onSubmit={onSubmit}>
                    <DialogHeader className="mb-4">
                        <DialogTitle>Create General Fund</DialogTitle>
                        <DialogDescription className="text-xs">Add a new general fund for organizing source of fund codes.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Field>
                            <Label htmlFor="code">Code</Label>
                            <Input name="code" placeholder="e.g. GF, SEF" onChange={onChangeInput} value={data.code} />
                            {errors.code && <span className="text-destructive text-sm">{errors.code}</span>}
                        </Field>
                        <Field>
                            <Label htmlFor="description">Description</Label>
                            <Input name="description" placeholder="Enter description" onChange={onChangeInput} value={data.description ?? ''} />
                        </Field>
                        <Field orientation="horizontal">
                            <Label htmlFor="status">Active</Label>
                            <Checkbox id="status" checked={data.status} onCheckedChange={(checked) => setData('status', Boolean(checked))} />
                        </Field>
                    </div>
                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                'Create'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
