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
import type { Office, OfficeCreateRequest } from "@/types/office"
import { useForm } from "@inertiajs/react"
import type { ChangeEventHandler, FormEventHandler } from "react"
import { toast } from "sonner"

interface EditOfficeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    office: Office
}
export function EditOfficeDialog({ isOpen, onClose, office }: EditOfficeDialogProps) {
    const { data, setData, put, reset, errors, processing } = useForm<OfficeCreateRequest>({
        name: office.name,
        code: office.code,
    })

    const onChangeInput: ChangeEventHandler<HTMLInputElement> = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    }

    const onSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('offices.update', office.id), {
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
                        <DialogTitle>Edit Office</DialogTitle>
                        <DialogDescription className="text-xs">
                            Update the office details by providing the required information. This will update the system records.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Field>
                            <Label htmlFor="name-1">Name</Label>
                            <Input name="name" placeholder="e.g. Office of the Municipal Mayor" onChange={onChangeInput} value={data.name} />
                            <span className="text-orange-600">{errors.name}</span>
                        </Field>
                        <Field>
                            <Label htmlFor="username-1">Code</Label>
                            <Input name="code" placeholder="e.g. MO" onChange={onChangeInput} value={data.code} />
                            <span className="text-orange-600">{errors.code}</span>
                        </Field>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Update Office</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
