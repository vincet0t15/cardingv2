import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { ClaimType } from '@/types/claimType';
import { FilterProps } from '@/types/filter';
import { PaginatedDataResponse } from '@/types/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { PencilIcon, PlusIcon, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreateClaimType } from './create';
import { DeleteClaimTypeDialog } from './delete';
import { EditClaimType } from './edit';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
    },
    {
        title: 'Claim Types',
        href: '/settings/claim-types',
    },
];

interface ClaimTypesProps {
    claimTypes: PaginatedDataResponse<ClaimType>;
    filters: FilterProps;
}

export default function ClaimTypesIndex({ claimTypes, filters }: ClaimTypesProps) {
    const { data, setData } = useForm({
        search: filters.search || '',
    });

    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedType, setSelectedType] = useState<ClaimType | null>(null);

    const handleEdit = (type: ClaimType) => {
        setSelectedType(type);
        setOpenEdit(true);
    };

    const handleDelete = (type: ClaimType) => {
        setSelectedType(type);
        setOpenDelete(true);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            const queryString = data.search ? { search: data.search } : undefined;

            router.get(route('claim-types.index'), queryString, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Claim Types" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Claim Types" description="Manage claim types for employee reimbursements and claims." />
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex justify-end">
                        <Button onClick={() => setOpenCreate(true)}>
                            <PlusIcon className="h-4 w-4" />
                            Add Claim Type
                        </Button>
                    </div>
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <div className="relative w-full sm:w-[250px]">
                            <Label htmlFor="search" className="sr-only">
                                Search
                            </Label>
                            <Input
                                id="search"
                                placeholder="Search the claim types..."
                                className="w-full pl-8"
                                value={data.search}
                                onChange={(e) => setData({ search: e.target.value })}
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
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {claimTypes.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                                        No claim types found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                claimTypes.data.map((type) => (
                                    <TableRow key={type.id}>
                                        <TableCell className="text-sm">{type.name}</TableCell>
                                        <TableCell className="text-sm">{type.code}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{type.description || '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant={type.is_active ? 'default' : 'destructive'} className="rounded-sm">
                                                {type.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                    onClick={() => handleEdit(type)}
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => handleDelete(type)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div>
                <Pagination data={claimTypes} />
            </div>
            {openCreate && <CreateClaimType open={openCreate} isOpen={setOpenCreate} />}
            {openEdit && selectedType && <EditClaimType open={openEdit} isOpen={setOpenEdit} selectedType={selectedType} />}
            {openDelete && selectedType && <DeleteClaimTypeDialog open={openDelete} onClose={() => setOpenDelete(false)} claimType={selectedType} />}
        </AppLayout>
    );
}
