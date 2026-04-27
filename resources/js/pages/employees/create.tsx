import { CustomComboBox } from '@/components/CustomComboBox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { EmployeeCreateRequest } from '@/types/employee';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import type { Office } from '@/types/office';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, UploadIcon, UserCheck, XIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEventHandler, type FormEventHandler } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
    {
        title: 'Create',
        href: '/employees/create',
    },
];

interface CreateEmployeeProps {
    employmentStatuses: EmploymentStatus[];
    offices: Office[];
    similarEmployees?: any[];
    warning?: string;
}

export default function CreateEmployee({ employmentStatuses, offices, similarEmployees = [], warning }: CreateEmployeeProps) {
    const page = usePage();
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [pendingData, setPendingData] = useState<any>(null);
    const photoPreviewUrlRef = useRef<string | null>(null);
    const duplicateToastIdRef = useRef<number | null>(null);

    const { data, setData, post, errors, reset } = useForm<EmployeeCreateRequest>({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        position: '',
        is_rata_eligible: false,
        office_id: '',
        employment_status_id: '',
        photo: null,
    });

    useEffect(() => {
        return () => {
            if (photoPreviewUrlRef.current) {
                URL.revokeObjectURL(photoPreviewUrlRef.current);
                photoPreviewUrlRef.current = null;
            }
        };
    }, []);

    // Show duplicate warning dialog when similar employees are found
    useEffect(() => {
        if (warning && similarEmployees.length > 0) {
            setShowDuplicateDialog(true);
            // Do not show a top-right toast here to avoid duplicating the dialog message.
            // The dialog itself communicates the warning to the user.
        }
    }, [warning, similarEmployees]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;

        if (photoPreviewUrlRef.current) {
            URL.revokeObjectURL(photoPreviewUrlRef.current);
            photoPreviewUrlRef.current = null;
        }

        if (file) {
            const url = URL.createObjectURL(file);
            photoPreviewUrlRef.current = url;
            setPhotoPreviewUrl(url);
        } else {
            setPhotoPreviewUrl(null);
        }

        setData('photo', file);
    };

    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        const { name, value } = e.target;
        setData(name as keyof EmployeeCreateRequest, value);
    };

    const handleSuffixChange = (value: string | null) => {
        setData('suffix', value ?? '');
    };

    const handleEmploymentStatusChange = (value: string | null) => {
        setData('employment_status_id', (value ?? '') as string | number);
    };

    const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        // Save a copy of the current form data so we can reuse it if the server returns a duplicate-warning redirect
        setPendingData({ ...data });

        post(route('employees.store'), {
            onSuccess: (response: { props: FlashProps }) => {
                // If server returned a duplicate warning (shows dialog), do NOT show a success toast.
                if (response.props?.warning) {
                    setShowDuplicateDialog(true);
                    return;
                }

                // dismiss duplicate-warning toast if present before showing success
                if (duplicateToastIdRef.current) {
                    try {
                        toast.dismiss(duplicateToastIdRef.current);
                    } catch (e) {
                        // ignore
                    }
                    duplicateToastIdRef.current = null;
                }

                toast.success(response.props.flash?.success ?? 'Employee created successfully');
                reset();
            },
            forceFormData: true,
            preserveState: true,
        });
    };

    const handleConfirmCreate = () => {
        setShowDuplicateDialog(false);
        // remove the duplicate-warning toast so it doesn't appear alongside the success toast
        if (duplicateToastIdRef.current) {
            try {
                toast.dismiss(duplicateToastIdRef.current);
            } catch (e) {
                // ignore if dismiss isn't supported
            }
            duplicateToastIdRef.current = null;
        }
        // Submit the form with force_create flag using router.post
        const formData = new FormData();

        // Prefer current client `data`, but fall back to `pendingData` (set before initial submit) if fields are empty
        const source = data.first_name || data.last_name || data.office_id || data.employment_status_id ? data : (pendingData ?? data);

        Object.entries(source).forEach(([key, value]) => {
            if (value === null || value === undefined) return;

            // Handle File objects directly
            if (key === 'photo' && value instanceof File) {
                formData.append(key, value);
                return;
            }

            // Normalize booleans to '1'/'0' for Laravel boolean validation
            if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
                return;
            }

            // Arrays or objects should be JSON-stringified
            if (typeof value === 'object') {
                formData.append(key, JSON.stringify(value));
                return;
            }

            // Fallback: append primitive values as strings
            formData.append(key, String(value));
        });
        formData.append('force_create', '1');

        router.post(route('employees.store'), formData, {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success ?? 'Employee created successfully');
                reset();
                setPhotoPreviewUrl(null);
            },
            onError: (errors: any) => {
                const firstField = Object.keys(errors || {})[0];
                const firstMsg = firstField ? errors[firstField] && errors[firstField][0] : null;
                toast.error(firstMsg ?? 'Failed to create employee');
            },
            forceFormData: true,
        });
    };

    const handleCancelCreate = () => {
        setShowDuplicateDialog(false);
        if (duplicateToastIdRef.current) {
            try {
                toast.dismiss(duplicateToastIdRef.current);
            } catch (e) {
                // ignore
            }
            duplicateToastIdRef.current = null;
        }
        toast.info('Employee creation cancelled. Please review and try again.');
    };

    const officeOptions = offices.map((office) => ({
        value: String(office.id),
        label: office.name,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.get(route('employees.index'))}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Create Employee</h1>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="bg-background rounded-xl p-6 shadow">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* LEFT SIDE - PHOTO */}
                            <div className="flex flex-col items-center space-y-4 md:col-span-1">
                                <input
                                    id="photo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />

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
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => {
                                                if (photoPreviewUrlRef.current) {
                                                    URL.revokeObjectURL(photoPreviewUrlRef.current);
                                                    photoPreviewUrlRef.current = null;
                                                }
                                                setPhotoPreviewUrl(null);
                                                setData('photo', null);
                                            }}
                                        >
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
                                                { value: 'Jr.', label: 'Jr.' },
                                                { value: 'Sr.', label: 'Sr.' },
                                                { value: 'II', label: 'II' },
                                                { value: 'III', label: 'III' },
                                            ]}
                                            placeholder="Suffix"
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
                                            onSelect={(value) => setData('office_id', (value ?? '') as string | number)}
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
                                        <p className="text-muted-foreground text-xs">
                                            Check if employee is eligible for RATA (e.g., Department Heads)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.get(route('employees.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Employee</Button>
                    </div>
                </form>
            </div>

            {/* Duplicate Employee Confirmation Dialog */}
            <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
                <DialogContent className="bg min-w-5xl">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Possible Duplicate Employee Detected
                        </DialogTitle>
                        <DialogDescription>
                            We found employees with similar names in the database. Please review the list below before proceeding.
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
                                    {similarEmployees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="text-muted-foreground h-4 w-4" />
                                                    {employee.first_name} {employee.middle_name || ''} {employee.last_name} {employee.suffix || ''}
                                                </div>
                                            </TableCell>
                                            <TableCell>{employee.position || 'N/A'}</TableCell>
                                            <TableCell>{employee.office?.name || 'N/A'}</TableCell>
                                            <TableCell>{employee.employment_status?.name || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="bg-muted rounded-md p-4 text-sm">
                            <p className="mb-1 font-medium">What would you like to do?</p>
                            <ul className="text-muted-foreground ml-4 list-disc space-y-1">
                                <li>
                                    If this is the <strong>same person</strong>, please cancel and update the existing employee record instead.
                                </li>
                                <li>
                                    If this is a <strong>different person</strong> with a similar name, click &quot;Continue Anyway&quot; to proceed.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <DialogFooter className="sm:gap-0">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancelCreate}>
                                Cancel & Review
                            </Button>
                            <Button onClick={handleConfirmCreate} className="gap-2">
                                <UserCheck className="h-4 w-4" />
                                Continue Anyway
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
