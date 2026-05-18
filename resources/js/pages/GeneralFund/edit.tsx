import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GeneralFund, GeneralFundCreateRequest } from '@/types/generalFund';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import type { ChangeEventHandler, FormEventHandler } from 'react';
import { toast } from 'sonner';

interface EditGeneralFundDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    generalFund: GeneralFund;
}

export function GeneralFundEditDialog({ open, setOpen, generalFund }: EditGeneralFundDialogProps) {
    const { data, setData, put, reset, errors, processing } = useForm<GeneralFundCreateRequest>({
        code: generalFund.code,
        description: generalFund.description || '',
        status: generalFund.status,
    });

    const onChangeInput: ChangeEventHandler<HTMLInputElement> = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('general-funds.update', generalFund.id), {
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
                        <DialogTitle>Edit General Fund</DialogTitle>
                        <DialogDescription className="text-xs">Update the general fund details.</DialogDescription>
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
                                    Updating...
                                </span>
                            ) : (
                                'Update'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
