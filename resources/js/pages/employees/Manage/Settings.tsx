import { CustomComboBox } from '@/components/CustomComboBox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Employee } from '@/types/employee';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import type { Office } from '@/types/office';
import { router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Trash2, UploadIcon, UserCheck, XIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEventHandler, type FormEventHandler } from 'react';
import { toast } from 'sonner';
import { DeleteEmployeeDialog } from './Settings/delete';

interface EmployeeSettingsProps {
    employee: Employee;
    employmentStatuses: EmploymentStatus[];
    offices: Office[];
    similarEmployees?: any[];
    warning?: string;
    editingEmployeeId?: number | null;
}

export default function EmployeeSettings({
    employee,
    employmentStatuses,
    offices,
    similarEmployees = [],
    warning,
    editingEmployeeId,
}: EmployeeSettingsProps) {
    const page = usePage();
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(employee.image_path || null);
    const photoPreviewUrlRef = useRef<string | null>(employee.image_path || null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState(false);

    const { data, setData, post, errors, processing } = useForm({
        first_name: employee.first_name || '',
        middle_name: employee.middle_name || '',
        last_name: employee.last_name || '',
        suffix: employee.suffix || '',
        position: employee.position || '',
        is_rata_eligible: employee.is_rata_eligible || false,
        office_id: String(employee.office_id) || '',
        employment_status_id: String(employee.employment_status_id) || '',
        photo: null as File | null,
        _method: 'PUT',
    });

    useEffect(() => {
        return () => {
            if (photoPreviewUrlRef.current && photoPreviewUrlRef.current.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreviewUrlRef.current);
            }
        };
    }, []);

    // Show duplicate warning dialog when similar employees are found
    useEffect(() => {
        if (warning && similarEmployees.length > 0 && editingEmployeeId === employee.id) {
            setShowDuplicateDialog(true);
            toast.warning('Possible duplicate employees detected. Please review before continuing.');
        }
    }, [warning, similarEmployees, editingEmployeeId, employee.id]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;

        if (photoPreviewUrlRef.current && photoPreviewUrlRef.current.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreviewUrlRef.current);
        }

        if (file) {
            const url = URL.createObjectURL(file);
            photoPreviewUrlRef.current = url;
            setPhotoPreviewUrl(url);
        } else {
            setPhotoPreviewUrl(employee.image_path || null);
            photoPreviewUrlRef.current = employee.image_path || null;
        }

        setData('photo', file);
    };

    const handleRemovePhoto = () => {
        if (photoPreviewUrlRef.current && photoPreviewUrlRef.current.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreviewUrlRef.current);
        }
        setPhotoPreviewUrl(null);
        photoPreviewUrlRef.current = null;
        setData('photo', null);
    };

    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleSuffixChange = (value: string | null) => {
        setData('suffix', value ?? '');
    };

    const handleEmploymentStatusChange = (value: string | null) => {
        setData('employment_status_id', value ?? '');
    };

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        post(route('employees.update', employee.id), {
            onSuccess: () => {
                toast.success('Employee updated successfully');
            },
            onError: (errors) => {
                if (Object.keys(errors).length > 0) {
                    toast.error('Please fix the form errors');
                }
            },
            forceFormData: true,
        });
    };

    const handleConfirmUpdate = () => {
        setShowDuplicateDialog(false);
        // Submit the form with force_update flag
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value as string | Blob);
            }
        });
        formData.append('force_update', 'true');

        router.post(route('employees.update', employee.id), formData, {
            onSuccess: () => {
                toast.success('Employee updated successfully');
            },
            onError: () => {
                toast.error('Failed to update employee');
            },
        });
    };

    const handleCancelUpdate = () => {
        setShowDuplicateDialog(false);
        toast.info('Employee update cancelled. Please review and try again.');
    };

    const officeOptions = offices.map((office) => ({
        value: String(office.id),
        label: office.name,
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Employee Information</h2>
                    <p className="text-muted-foreground text-sm">Update employee's personal and employment details.</p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                <div className="bg-background rounded-xl p-6 shadow">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* LEFT SIDE - PHOTO */}
                        <div className="flex flex-col items-center space-y-4 md:col-span-1">
                            <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />

                            <button
                                type="button"
                                className="bg-background relative flex aspect-square w-full max-w-xs cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed"
                                onClick={() => document.getElementById('photo')?.click()}
                            >
                                {photoPreviewUrl ? (
                                    <img src={photoPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                                        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                                            <UploadIcon className="text-muted-foreground size-5" />
                                        </div>
                                        <div className="text-sm font-semibold">Upload Photo</div>
                                        <div className="text-muted-foreground text-xs">Click to browse</div>
                                    </div>
                                )}
                            </button>

                            <div className="flex flex-wrap justify-center gap-2">
                                <Button type="button" variant="outline" onClick={() => document.getElementById('photo')?.click()}>
                                    <UploadIcon className="mr-1 size-4" />
                                    {photoPreviewUrl ? 'Change' : 'Choose'}
                                </Button>

                                {photoPreviewUrl && (
                                    <Button type="button" variant="destructive" onClick={handleRemovePhoto}>
                                        <XIcon className="mr-1 size-4" />
                                        Remove
                                    </Button>
                                )}
                            </div>

                            <p className="text-muted-foreground text-center text-xs">jpeg, jpg, png, webp (max 2MB)</p>
                        </div>

                        {/* RIGHT SIDE - FORM */}
                        <div className="space-y-4 md:col-span-2">
                            {/* NAME */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2">
                                <div className="flex w-full flex-col gap-1">
                                    <Label>First Name</Label>
                                    <Input name="first_name" value={data.first_name} onChange={handleInputChange} placeholder="First Name" />
                                    {errors.first_name && <p className="text-destructive text-xs">{errors.first_name}</p>}
                                </div>
                                <div className="flex w-full flex-col gap-1">
                                    <Label>Middle Name</Label>
                                    <Input name="middle_name" value={data.middle_name} onChange={handleInputChange} placeholder="Middle Name" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2">
                                <div className="flex w-full flex-col gap-1">
                                    <Label>Last Name</Label>
                                    <Input name="last_name" value={data.last_name} onChange={handleInputChange} placeholder="Last Name" />
                                    {errors.last_name && <p className="text-destructive text-xs">{errors.last_name}</p>}
                                </div>
                                <div className="flex w-full flex-col gap-1">
                                    <Label>Suffix</Label>
                                    <CustomComboBox
                                        items={[
                                            { value: 'None', label: 'None' },
                                            { value: 'Jr.', label: 'Jr.' },
                                            { value: 'Sr.', label: 'Sr.' },
                                            { value: 'II', label: 'II' },
                                            { value: 'III', label: 'III' },
                                        ]}
                                        placeholder="None"
                                        value={data.suffix || null}
                                        onSelect={handleSuffixChange}
                                    />
                                </div>
                            </div>

                            {/* POSITION / OFFICE */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex w-full flex-col gap-1">
                                    <Label>Position</Label>
                                    <Input name="position" value={data.position} onChange={handleInputChange} placeholder="Position" />
                                </div>
                                <div className="flex w-full flex-col gap-1">
                                    <Label>Office</Label>
                                    <CustomComboBox
                                        items={officeOptions}
                                        placeholder="Select Office"
                                        onSelect={(value) => setData('office_id', (value ?? '') as string)}
                                        value={String(data.office_id)}
                                    />
                                    {errors.office_id && <p className="text-destructive text-xs">{errors.office_id}</p>}
                                </div>
                            </div>

                            {/* EMPLOYMENT STATUS / RATA */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex w-full flex-col gap-1">
                                    <Label>Employment Status</Label>
                                    <CustomComboBox
                                        items={employmentStatuses.map((s) => ({ value: String(s.id), label: s.name }))}
                                        placeholder="Select Status"
                                        value={data.employment_status_id ? String(data.employment_status_id) : null}
                                        onSelect={handleEmploymentStatusChange}
                                    />
                                    {errors.employment_status_id && <p className="text-destructive text-xs">{errors.employment_status_id}</p>}
                                </div>
                                <div className="flex w-full flex-col gap-1">
                                    <Label className="mb-2">RATA Eligible</Label>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id="is_rata_eligible"
                                            checked={data.is_rata_eligible}
                                            onCheckedChange={(checked: boolean) => setData('is_rata_eligible', checked)}
                                        />
                                        <Label htmlFor="is_rata_eligible" className="font-normal">
                                            {data.is_rata_eligible ? 'Yes' : 'No'}
                                        </Label>
                                    </div>
                                    <p className="text-muted-foreground text-xs">Check if employee is eligible for RATA (e.g., Department Heads)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button type="button" variant="destructive" onClick={() => setOpenDeleteDialog(true)}>
                            <Trash2 className="mr-1 size-4" />
                            Delete Employee
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => router.get(route('employees.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </form>

            {openDeleteDialog && <DeleteEmployeeDialog open={openDeleteDialog} onClose={setOpenDeleteDialog} employee={employee} />}

            {/* Duplicate Employee Confirmation Dialog */}
            <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
                <DialogContent className="bg min-w-5xl">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Possible Duplicate Employee Detected
                        </DialogTitle>
                        <DialogDescription>
                            We found other employees with similar names in the database. Please review the list below before proceeding.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                The following employees have names similar to{' '}
                                <strong>
                                    {data.first_name} {data.last_name}
                                </strong>
                                :
                            </AlertDescription>
                        </Alert>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Full Name</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Office</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {similarEmployees.map((emp) => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="text-muted-foreground h-4 w-4" />
                                                    {emp.first_name} {emp.middle_name || ''} {emp.last_name} {emp.suffix || ''}
                                                </div>
                                            </TableCell>
                                            <TableCell>{emp.position || 'N/A'}</TableCell>
                                            <TableCell>{emp.office?.name || 'N/A'}</TableCell>
                                            <TableCell>{emp.employment_status?.name || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="bg-muted rounded-md p-4 text-sm">
                            <p className="mb-1 font-medium">What would you like to do?</p>
                            <ul className="text-muted-foreground ml-4 list-disc space-y-1">
                                <li>
                                    If this is the <strong>same person</strong>, please cancel and review the existing employee record.
                                </li>
                                <li>
                                    If this is a <strong>different person</strong> with a similar name, click &quot;Continue Anyway&quot; to proceed
                                    with the update.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <DialogFooter className="sm:gap-0">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancelUpdate}>
                                Cancel & Review
                            </Button>
                            <Button onClick={handleConfirmUpdate} className="gap-2">
                                <UserCheck className="h-4 w-4" />
                                Continue Anyway
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
