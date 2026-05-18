import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Employee } from '@/types/employee';
import { router } from '@inertiajs/react';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useState } from 'react';

interface EmployeePageProps {
    employee: Employee;
}

interface EmployeeShowProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
}

export function EmployeeShow({ isOpen, onClose, employee }: EmployeeShowProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleManage = () => {
        onClose();
        router.get(route('manage.employees.index', employee.id));
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogTitle>Employee Details</DialogTitle>
                <DialogDescription hidden className="text-muted-foreground mb-4 text-sm">
                    View detailed information about the employee and manage their profile.
                </DialogDescription>
                <DialogContent className="bg-background w-[400px] overflow-hidden rounded-lg border p-0 shadow-lg">
                    {/* Header with Avatar */}
                    <div className="bg-muted/30 flex flex-col items-center gap-3 pt-8 pb-4">
                        <Avatar className="ring-background h-24 w-24 shadow-lg ring-4">
                            <AvatarImage src={employee.image_path || ''} alt="Employee" />
                            <AvatarFallback className="text-lg font-semibold">
                                {employee.first_name?.charAt(0) || ''}
                                {employee.last_name?.charAt(0) || ''}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1 text-center">
                            <h2 className="text-foreground text-xl font-semibold tracking-tight uppercase">
                                {employee.last_name}, {employee.first_name} {employee.middle_name?.charAt(0)}. {employee.suffix}
                            </h2>
                            <p className="text-muted-foreground text-sm">{employee.position}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4 px-6 py-4">
                        {/* Info Section */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between border-b py-2 text-sm">
                                <span className="text-muted-foreground">Department</span>
                                <span className="truncate text-right font-medium uppercase">{employee.office?.code}</span>
                            </div>
                            <div className="flex items-center justify-between border-b py-2 text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <span className="truncate text-right font-medium uppercase">{employee.employment_status?.name}</span>
                            </div>
                            <div className="flex items-center justify-between border-b py-2 text-sm">
                                <span className="text-muted-foreground">RATA Eligible</span>
                                <span className={`text-right font-medium ${employee.is_rata_eligible ? 'text-green-600' : 'text-gray-500'}`}>
                                    {employee.is_rata_eligible ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 text-sm">
                                <span className="text-muted-foreground">Salary</span>
                                <span className="text-right font-medium">
                                    {employee.latest_salary
                                        ? `₱${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(Number(employee.latest_salary.amount))}`
                                        : 'Not set'}
                                </span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button variant="default" className="flex-1" onClick={handleManage}>
                                Manage
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Default page export for /employees/{id}
export default function EmployeeShowPage({ employee }: EmployeePageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employees',
            href: '/employees',
        },
        {
            title: `${employee.first_name} ${employee.last_name}`,
            href: `/employees/${employee.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${employee.first_name} ${employee.last_name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.get(route('employees.index'))}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Employee Details</h1>
                </div>

                <div className="bg-background rounded-xl p-6 shadow">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Left Side - Avatar */}
                        <div className="flex flex-col items-center gap-4 md:col-span-1">
                            <Avatar className="ring-background h-32 w-32 shadow-lg ring-4">
                                <AvatarImage src={employee.image_path || ''} alt="Employee" />
                                <AvatarFallback className="text-2xl font-semibold">
                                    {employee.first_name?.charAt(0) || ''}
                                    {employee.last_name?.charAt(0) || ''}
                                </AvatarFallback>
                            </Avatar>
                            <Button variant="default" className="w-full" onClick={() => router.get(route('manage.employees.index', employee.id))}>
                                Manage Employee
                            </Button>
                        </div>

                        {/* Right Side - Details */}
                        <div className="space-y-4 md:col-span-2">
                            <div>
                                <h2 className="text-xl font-semibold uppercase">
                                    {employee.last_name}, {employee.first_name}
                                    {employee.middle_name && ` ${employee.middle_name.charAt(0)}.`}
                                    {employee.suffix && ` ${employee.suffix}`}
                                </h2>
                                <p className="text-muted-foreground">{employee.position || 'N/A'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground text-xs uppercase">Department</p>
                                    <p className="mt-1 font-semibold">{employee.office?.name || 'N/A'}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground text-xs uppercase">Status</p>
                                    <p className="mt-1 font-semibold">{employee.employment_status?.name || 'N/A'}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground text-xs uppercase">RATA Eligible</p>
                                    <p className={`mt-1 font-semibold ${employee.is_rata_eligible ? 'text-green-600' : 'text-gray-500'}`}>
                                        {employee.is_rata_eligible ? 'Yes' : 'No'}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground text-xs uppercase">Salary</p>
                                    <p className="mt-1 font-semibold">
                                        {employee.latest_salary
                                            ? `₱${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(Number(employee.latest_salary.amount))}`
                                            : 'Not set'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
