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
import type { EmploymentStatus, EmploymentStatusCreateRequest } from "@/types/employmentStatuses"
import { useForm } from "@inertiajs/react"
import { LoaderCircle } from "lucide-react"
import type { ChangeEventHandler, FormEventHandler } from "react"
import { toast } from "sonner"

interface CreateEmploymentStatusDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employmentStatus: EmploymentStatus
}
export function EditEmploymentStatusDialog({ isOpen, onClose, employmentStatus }: CreateEmploymentStatusDialogProps) {
    const { data, setData, put, reset, errors, processing } = useForm<EmploymentStatusCreateRequest>({
        name: employmentStatus.name,
    })

    const onChangeInput: ChangeEventHandler<HTMLInputElement> = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    }

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('employment-statuses.update', employmentStatus.id), {
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
                        <DialogTitle>Edit Employment Status</DialogTitle>
                        <DialogDescription className="text-xs">
                            Update the employment status details by providing the required information. This will update the system records.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Field>
                            <Label htmlFor="name-1">Name</Label>
                            <Input name="name" placeholder="e.g. Permanent" onChange={onChangeInput} value={data.name} />
                            <span className="text-orange-600">{errors.name}</span>
                        </Field>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
