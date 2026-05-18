import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import type { FilterProps } from '@/types/filter';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { PencilIcon, PlusIcon, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreateEmploymentStatusDialog } from './create';
import { DeleteEmploymentStatusDialog } from './delete';
import { EditEmploymentStatusDialog } from './edit';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
    },
    {
        title: 'Employment Status',
        href: '/settings/employment-statuses',
    },
];
interface EmploymentStatusProps {
    employmentStatuses: PaginatedDataResponse<EmploymentStatus>;
    filters: FilterProps;
}
export default function EmploymentStatusIndex({ employmentStatuses, filters }: EmploymentStatusProps) {
    const { data, setData } = useForm({
        search: filters.search || '',
    });
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedEmploymentStatus, setSelectedEmploymentStatus] = useState<EmploymentStatus | null>(null);

    const onEditClick = (employmentStatus: EmploymentStatus) => {
        setSelectedEmploymentStatus(employmentStatus);
        setOpenEditDialog(true);
    };
    const onDeleteClick = (employmentStatus: EmploymentStatus) => {
        setSelectedEmploymentStatus(employmentStatus);
        setOpenDeleteDialog(true);
    };
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const queryString = data.search ? { search: data.search } : {};

            router.get(route('employment-statuses.index'), queryString, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employment Status" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Employment Status"
                    description="View and manage employees by their status, including Permanent, COS, Contractual, and Probationary roles."
                />
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button onClick={() => setOpenCreateDialog(true)}>
                        <PlusIcon className="h-4 w-4" />
                        Employment Status
                    </Button>

                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <div className="relative w-full sm:w-[250px]">
                            <Label htmlFor="search" className="sr-only">
                                Search
                            </Label>
                            <Input
                                id="search"
                                placeholder="Search the employment status..."
                                className="w-full pl-8"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
                        </div>
                    </div>
                </div>
                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Name</TableHead>
                                <TableHead className="text-primary text-right font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employmentStatuses.data.length > 0 ? (
                                employmentStatuses.data.map((employmentStatus) => (
                                    <TableRow key={employmentStatus.id} className="hover:bg-muted/30 text-sm">
                                        <TableCell className="text-sm">{employmentStatus.name}</TableCell>

                                        <TableCell className="flex items-center justify-end gap-2 text-sm">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                onClick={() => onEditClick(employmentStatus)}
                                                title="Edit"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => onDeleteClick(employmentStatus)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-3 text-center text-gray-500">
                                        No data available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div>
                    <Pagination data={employmentStatuses} />
                </div>
                {openCreateDialog && <CreateEmploymentStatusDialog isOpen={openCreateDialog} onClose={() => setOpenCreateDialog(false)} />}

                {openEditDialog && selectedEmploymentStatus && (
                    <EditEmploymentStatusDialog
                        isOpen={openEditDialog}
                        onClose={() => setOpenEditDialog(false)}
                        employmentStatus={selectedEmploymentStatus}
                    />
                )}
                {openDeleteDialog && selectedEmploymentStatus && (
                    <DeleteEmploymentStatusDialog
                        isOpen={openDeleteDialog}
                        onClose={() => setOpenDeleteDialog(false)}
                        employmentStatus={selectedEmploymentStatus}
                    />
                )}
            </div>
        </AppLayout>
    );
}
