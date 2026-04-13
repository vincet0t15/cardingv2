import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SourceOfFundCode } from '@/types/sourceOfFundCOde';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { ChangeEventHandler, FormEventHandler } from 'react';
import { toast } from 'sonner';

interface EditSourceOfFundCodeDialogProps {
    open: boolean;
    onClose: (open: boolean) => void;
    sourceOfFundCode: SourceOfFundCode;
}

export function EditSourceOfFundCodeDialog({ open, onClose, sourceOfFundCode }: EditSourceOfFundCodeDialogProps) {
    const { data, setData, processing, put, errors, reset } = useForm({
        code: sourceOfFundCode.code,
        description: sourceOfFundCode.description || '',
        status: sourceOfFundCode.status,
        parent_id: sourceOfFundCode.parent_id,
        is_category: sourceOfFundCode.is_category,
        general_fund_id: sourceOfFundCode.general_fund_id,
    });

    const onChangeInput: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
        setData(e.target.name as keyof typeof data, e.target.value);
    };

    const onCheckedChangeStatus = (value: boolean | 'indeterminate') => {
        setData('status', typeof value === 'boolean' ? value : false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
        }
        onClose(isOpen);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('source-of-fund-codes.update', sourceOfFundCode.id), {
            onSuccess: () => {
                toast.success('Source of fund code updated successfully.');
                onClose(false);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(firstError || 'Failed to update source of fund code.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Edit Source of Fund Code</DialogTitle>
                        <DialogDescription>Update the source of fund code details.</DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        <Field>
                            <Label htmlFor="code">Code</Label>
                            <Input id="code" name="code" value={data.code} placeholder="e.g., 1011-01" onChange={onChangeInput} />
                            {errors.code && <p className="text-destructive mt-1 text-sm">{errors.code}</p>}
                        </Field>
                        <Field>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={data.description || ''}
                                placeholder="Enter description"
                                onChange={onChangeInput}
                            />
                        </Field>
                        <Field orientation="horizontal">
                            <Label htmlFor="status">Active</Label>
                            <Checkbox id="status" name="status" checked={data.status} onCheckedChange={onCheckedChangeStatus} />
                        </Field>
                    </FieldGroup>
                    <DialogFooter className="mt-4">
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
