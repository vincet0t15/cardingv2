import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EmploymentStatusCreateRequest } from "@/types/employmentStatuses"
import { useForm } from "@inertiajs/react"
import type { ChangeEventHandler, FormEventHandler } from "react"
import { toast } from "sonner"

interface CreateEmploymentStatusDialogProps {
    isOpen: boolean;
    onClose: () => void;
}
export function CreateEmploymentStatusDialog({ isOpen, onClose }: CreateEmploymentStatusDialogProps) {
    const { data, setData, post, reset, errors, processing } = useForm<EmploymentStatusCreateRequest>({
        name: '',
    })

    const onChangeInput: ChangeEventHandler<HTMLInputElement> = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    }

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('employment-statuses.store'), {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success);
                onClose();
                reset();
            },
        });
    }
    return (
        <Dialog open={isOpen} onOpenChange={onClose} >
            <DialogContent className="sm:max-w-sm rounded-md">
                <form onSubmit={onSubmit} >
                    <DialogHeader className="mb-4">
                        <DialogTitle>Create Employment Status</DialogTitle>
                        <DialogDescription className="text-xs">
                            Add a new employment status by providing the required details. This will be included in the system records.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Field>
                            <Label htmlFor="name-1">Name</Label>
                            <Input name="name" placeholder="e.g. Permanent" onChange={onChangeInput} />
                            <span className="text-orange-600">{errors.name}</span>
                        </Field>

                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Create</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
