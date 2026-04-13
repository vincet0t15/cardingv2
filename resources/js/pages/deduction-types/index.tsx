import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { DeductionType } from '@/types/deductionType';
import { FilterProps } from '@/types/filter';
import { PaginatedDataResponse } from '@/types/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { CircleCheck, Loader2, PencilIcon, PlusIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
    },
    {
        title: 'Deduction Types',
        href: '/settings/deduction-types',
    },
];

interface DeductionTypesProps {
    deductionTypes: PaginatedDataResponse<DeductionType>;
}

export default function DeductionTypesIndex({ deductionTypes }: DeductionTypesProps) {
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedType, setSelectedType] = useState<DeductionType | null>(null);

    const {
        data: createData,
        setData: setCreateData,
        post,
        reset: resetCreate,
        errors: createErrors,
    } = useForm({
        name: '',
        code: '',
        description: '',
        is_active: true as boolean,
    });

    const {
        data: editData,
        setData: setEditData,
        put,
        reset: resetEdit,
        errors: editErrors,
    } = useForm({
        name: '',
        code: '',
        description: '',
        is_active: true as boolean,
    });

    const handleCreate = () => {
        post(route('deduction-types.store'), {
            onSuccess: (response: { props: FilterProps }) => {
                toast.success(response.props.flash?.success);
                resetCreate();
                setOpenCreate(false);
            },
        });
    };

    const handleEdit = (type: DeductionType) => {
        setSelectedType(type);
        setEditData({
            name: type.name,
            code: type.code,
            description: type.description || '',
            is_active: type.is_active,
        });
        setOpenEdit(true);
    };

    const handleUpdate = () => {
        if (!selectedType) return;
        put(route('deduction-types.update', selectedType.id), {
            onSuccess: () => {
                resetEdit();
                setOpenEdit(false);
                setSelectedType(null);
            },
        });
    };

    const handleDelete = (type: DeductionType) => {
        if (confirm('Are you sure you want to delete this deduction type?')) {
            router.delete(route('deduction-types.destroy', type.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deduction Types" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Deduction Types" description="Manage deduction types for employee payroll deductions." />

                <div className="flex justify-end">
                    <Button onClick={() => setOpenCreate(true)}>
                        <PlusIcon className="h-4 w-4" />
                        Add Deduction Type
                    </Button>
                </div>

                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Name</TableHead>
                                <TableHead className="text-primary font-bold">Code</TableHead>
                                <TableHead className="text-primary font-bold">Description</TableHead>
                                <TableHead className="text-primary font-bold">Status</TableHead>
                                <TableHead className="text-primary w-[100px] text-center font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {deductionTypes.data.length > 0 ? (
                                deductionTypes.data.map((type: DeductionType) => (
                                    <TableRow key={type.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{type.name}</TableCell>
                                        <TableCell>
                                            <code className="bg-muted rounded px-2 py-1 text-sm">{type.code}</code>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{type.description || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-muted-foreground px-1.5">
                                                {type.is_active === true ? (
                                                    <CircleCheck className="fill-green-500 dark:fill-green-400" />
                                                ) : (
                                                    <Loader2 className="fill-yellow-500 dark:fill-yellow-400" />
                                                )}
                                                {type.is_active === true ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}>
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(type)}>
                                                    <Trash2 className="text-destructive h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-3 text-center text-gray-500">
                                        No deduction types found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div>
                    <Pagination data={deductionTypes} />
                </div>

                {/* Create Dialog */}
                <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Deduction Type</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={createData.name}
                                    onChange={(e) => setCreateData('name', e.target.value)}
                                    placeholder="e.g., GSIS Premium"
                                />
                                {createErrors.name && <p className="text-destructive text-sm">{createErrors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="code">Code</Label>
                                <Input
                                    id="code"
                                    value={createData.code}
                                    onChange={(e) => setCreateData('code', e.target.value.toUpperCase())}
                                    placeholder="e.g., GSIS"
                                />
                                {createErrors.code && <p className="text-destructive text-sm">{createErrors.code}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={createData.description}
                                    onChange={(e) => setCreateData('description', e.target.value)}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_active"
                                    checked={createData.is_active}
                                    onCheckedChange={(checked) => setCreateData('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenCreate(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Deduction Type</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input id="edit-name" value={editData.name} onChange={(e) => setEditData('name', e.target.value)} />
                                {editErrors.name && <p className="text-destructive text-sm">{editErrors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-code">Code</Label>
                                <Input id="edit-code" value={editData.code} onChange={(e) => setEditData('code', e.target.value.toUpperCase())} />
                                {editErrors.code && <p className="text-destructive text-sm">{editErrors.code}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                    id="edit-description"
                                    value={editData.description}
                                    onChange={(e) => setEditData('description', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="edit-is_active"
                                    checked={editData.is_active}
                                    onCheckedChange={(checked) => setEditData('is_active', checked)}
                                />
                                <Label htmlFor="edit-is_active">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenEdit(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdate}>Update</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
