import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { AdjustmentType } from '@/types/adjustmentType';
import type { FilterProps } from '@/types/filter';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { PencilIcon, PlusIcon, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreateAdjustmentTypeDialog } from './create';
import { DeleteAdjustmentTypeDialog } from './delete';
import { EditAdjustmentTypeDialog } from './edit';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
    },
    {
        title: 'Adjustment Types',
        href: '/settings/adjustment-types',
    },
];

interface AdjustmentTypeProps {
    adjustmentTypes: PaginatedDataResponse<AdjustmentType>;
    filters: FilterProps;
}

export default function AdjustmentTypeIndex({ adjustmentTypes, filters }: AdjustmentTypeProps) {
    const { data, setData } = useForm({
        search: filters.search || '',
    });
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedAdjustmentType, setSelectedAdjustmentType] = useState<AdjustmentType | null>(null);

    const onEditClick = (adjustmentType: AdjustmentType) => {
        setSelectedAdjustmentType(adjustmentType);
        setOpenEditDialog(true);
    };

    const onDeleteClick = (adjustmentType: AdjustmentType) => {
        setSelectedAdjustmentType(adjustmentType);
        setOpenDeleteDialog(true);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const queryString = data.search ? { search: data.search } : {};

            router.get(route('adjustment-types.index'), queryString, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Adjustment Types" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading
                    title="Adjustment Types"
                    description="Manage adjustment types for payroll adjustments including refunds, deductions, and corrections."
                />
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button onClick={() => setOpenCreateDialog(true)}>
                        <PlusIcon className="h-4 w-4" />
                        Adjustment Type
                    </Button>

                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <div className="relative w-full sm:w-[250px]">
                            <Label htmlFor="search" className="sr-only">
                                Search
                            </Label>
                            <Input
                                id="search"
                                placeholder="Search adjustment types..."
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
                                <TableHead className="text-primary font-bold">Effect</TableHead>
                                <TableHead className="text-primary font-bold">Description</TableHead>
                                <TableHead className="text-primary text-right font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {adjustmentTypes.data.length > 0 ? (
                                adjustmentTypes.data.map((adjustmentType) => (
                                    <TableRow key={adjustmentType.id} className="hover:bg-muted/30 text-sm">
                                        <TableCell className="text-sm font-medium">{adjustmentType.name}</TableCell>
                                        <TableCell className="text-sm">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    adjustmentType.effect === 'positive'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}
                                            >
                                                {adjustmentType.effect === 'positive' ? '↑ Positive' : '↓ Negative'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-md truncate text-sm text-gray-600">{adjustmentType.description || '—'}</TableCell>
                                        <TableCell className="flex items-center justify-end gap-2 text-sm">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                onClick={() => onEditClick(adjustmentType)}
                                                title="Edit"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => onDeleteClick(adjustmentType)}
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
                                        No adjustment types found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div>
                    <Pagination data={adjustmentTypes} />
                </div>
                {openCreateDialog && <CreateAdjustmentTypeDialog isOpen={openCreateDialog} onClose={() => setOpenCreateDialog(false)} />}

                {openEditDialog && selectedAdjustmentType && (
                    <EditAdjustmentTypeDialog
                        isOpen={openEditDialog}
                        onClose={() => setOpenEditDialog(false)}
                        adjustmentType={selectedAdjustmentType}
                    />
                )}
                {openDeleteDialog && selectedAdjustmentType && (
                    <DeleteAdjustmentTypeDialog
                        isOpen={openDeleteDialog}
                        onClose={() => setOpenDeleteDialog(false)}
                        adjustmentType={selectedAdjustmentType}
                    />
                )}
            </div>
        </AppLayout>
    );
}
