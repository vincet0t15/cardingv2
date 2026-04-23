import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { DeductionCategory, DeductionType } from '@/types/deductionType';
import { PaginatedDataResponse } from '@/types/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { PencilIcon, PlusIcon, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'Deduction Categories', href: '/settings/deduction-categories' },
];

interface DeductionCategoriesProps {
    categories: PaginatedDataResponse<DeductionCategory>;
    uncategorizedTypes: DeductionType[];
    allCategories: { id: number; name: string }[];
    filters: { search?: string };
}

export default function DeductionCategoriesIndex({ categories, uncategorizedTypes, allCategories, filters }: DeductionCategoriesProps) {
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openCreateType, setOpenCreateType] = useState(false);
    const [selectedCategoryForType, setSelectedCategoryForType] = useState<DeductionCategory | null>(null);
    const [selected, setSelected] = useState<DeductionCategory | null>(null);
    const { data: createData, setData: setCreateData, post, reset: resetCreate, errors: createErrors } = useForm({ name: '' });
    const { data: editData, setData: setEditData, put, reset: resetEdit, errors: editErrors } = useForm({ name: '' });

    const {
        data: createTypeData,
        setData: setCreateTypeData,
        post: postType,
        reset: resetCreateType,
        errors: createTypeErrors,
    } = useForm({
        name: '',
        code: '',
        category_id: null as number | null,
        description: '',
        is_active: true as boolean,
    });

    const {
        data: editTypeData,
        setData: setEditTypeData,
        put: putType,
        reset: resetEditType,
        errors: editTypeErrors,
    } = useForm({
        name: '',
        code: '',
        category_id: null as number | null,
        description: '',
        is_active: true as boolean,
    });

    const [selectedType, setSelectedType] = useState<any | null>(null);
    const [openEditType, setOpenEditType] = useState(false);
    const [selectedTypeToDelete, setSelectedTypeToDelete] = useState<any | null>(null);
    const [openDeleteType, setOpenDeleteType] = useState(false);
    const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState<DeductionCategory | null>(null);
    const [openDeleteCategory, setOpenDeleteCategory] = useState(false);

    const handleCreate = () => {
        post(route('deduction-categories.store'), {
            onSuccess: (response: any) => {
                toast.success(response.props.flash?.success ?? 'Category created');
                resetCreate();
                setOpenCreate(false);
            },
        });
    };

    const handleEdit = (c: DeductionCategory) => {
        setSelected(c);
        setEditData({ name: c.name });
        setOpenEdit(true);
    };

    const handleUpdate = () => {
        if (!selected) return;
        put(route('deduction-categories.update', selected.id), {
            onSuccess: () => {
                resetEdit();
                setOpenEdit(false);
                setSelected(null);
            },
        });
    };

    const handleDelete = (c: DeductionCategory) => {
        setSelectedCategoryToDelete(c);
        setOpenDeleteCategory(true);
    };

    const openCreateTypeFor = (c: DeductionCategory) => {
        setSelectedCategoryForType(c);
        setCreateTypeData('category_id', c.id);
        setOpenCreateType(true);
    };

    const handleCreateType = () => {
        postType(route('deduction-types.store'), {
            onSuccess: (res: any) => {
                toast.success(res.props.flash?.success || 'Deduction type created');
                resetCreateType();
                setOpenCreateType(false);
                setSelectedCategoryForType(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deduction Categories" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Deduction Categories" description="Manage deduction categories used to group deduction types." />

                <div className="flex justify-end">
                    <Button onClick={() => setOpenCreate(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                </div>

                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Name</TableHead>
                                <TableHead className="text-primary w-[120px] text-center font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.data.length > 0 ? (
                                categories.data.map((c) => {
                                    const types = (c as any).deductionTypes ?? (c as any).deduction_types ?? [];

                                    return (
                                        <Fragment key={c.id}>
                                            <TableRow className="hover:bg-muted/30">
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openCreateTypeFor(c)}
                                                            title="Add Deduction Type"
                                                        >
                                                            <PlusIcon className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
                                                            <Trash2 className="text-destructive h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            <TableRow key={`${c.id}-types`}>
                                                <TableCell colSpan={2} className="bg-muted/10">
                                                    {types && types.length > 0 ? (
                                                        <div className="">
                                                            <div className="overflow-x-auto">
                                                                <Table>
                                                                    <TableBody>
                                                                        {types.map((t: any) => (
                                                                            <TableRow key={t.id} className="border-t">
                                                                                <TableCell className="px-2 py-2">
                                                                                    <div className="font-medium">{t.name}</div>
                                                                                </TableCell>
                                                                                <TableCell className="text-muted-foreground px-2 py-2">
                                                                                    {t.code}
                                                                                </TableCell>
                                                                                <TableCell className="px-2 py-2 text-right">
                                                                                    <div className="flex items-center justify-end gap-2">
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            onClick={() => {
                                                                                                setSelectedType(t);
                                                                                                setEditTypeData({
                                                                                                    name: t.name || '',
                                                                                                    code: t.code || '',
                                                                                                    category_id: t.category_id ?? null,
                                                                                                    description: t.description || '',
                                                                                                    is_active: !!t.is_active,
                                                                                                });
                                                                                                setOpenEditType(true);
                                                                                            }}
                                                                                            title="Edit Type"
                                                                                        >
                                                                                            <PencilIcon className="h-4 w-4" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            onClick={() => {
                                                                                                setSelectedTypeToDelete(t);
                                                                                                setOpenDeleteType(true);
                                                                                            }}
                                                                                        >
                                                                                            <Trash2 className="text-destructive h-4 w-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-2 text-sm text-gray-500">No deduction types under this category.</div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        </Fragment>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="py-12 text-center text-gray-500">
                                        No categories found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination data={categories} />
                {uncategorizedTypes && uncategorizedTypes.length > 0 && (
                    <div className="mt-6">
                        <Heading
                            title="Uncategorized Deduction Types"
                            description="Deduction types without a category. You can edit and assign a category."
                        />
                        <div className="mt-2 w-full overflow-hidden rounded-sm border shadow-sm">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="text-primary font-bold">Name</TableHead>
                                        <TableHead className="text-primary font-bold">Code</TableHead>
                                        <TableHead className="text-primary w-[160px] text-center font-bold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {uncategorizedTypes.map((t) => (
                                        <TableRow key={t.id} className="border-t">
                                            <TableCell className="px-2 py-2">{t.name}</TableCell>
                                            <TableCell className="text-muted-foreground px-2 py-2">{t.code}</TableCell>
                                            <TableCell className="px-2 py-2 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedType(t);
                                                            setEditTypeData({
                                                                name: t.name || '',
                                                                code: t.code || '',
                                                                category_id: t.category_id ?? null,
                                                                description: t.description || '',
                                                                is_active: !!t.is_active,
                                                            });
                                                            setOpenEditType(true);
                                                        }}
                                                        title="Edit Type"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedTypeToDelete(t);
                                                            setOpenDeleteType(true);
                                                        }}
                                                    >
                                                        <Trash2 className="text-destructive h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={createData.name} onChange={(e) => setCreateData('name', e.target.value)} />
                            {createErrors.name && <p className="text-destructive text-sm">{createErrors.name}</p>}
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

            <Dialog open={openDeleteCategory} onOpenChange={setOpenDeleteCategory}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                    </DialogHeader>
                    <div className="">
                        Are you sure you want to delete the category "{selectedCategoryToDelete?.name}"? This will fail if the category has deduction
                        types.
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpenDeleteCategory(false);
                                setSelectedCategoryToDelete(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!selectedCategoryToDelete) return;
                                router.delete(route('deduction-categories.destroy', selectedCategoryToDelete.id), {
                                    onSuccess: () => {
                                        toast.success('Category deleted');
                                        setOpenDeleteCategory(false);
                                        setSelectedCategoryToDelete(null);
                                    },
                                });
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input id="edit-name" value={editData.name} onChange={(e) => setEditData('name', e.target.value)} />
                            {editErrors.name && <p className="text-destructive text-sm">{editErrors.name}</p>}
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

            <Dialog open={openCreateType} onOpenChange={setOpenCreateType}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Deduction Type (under category)</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type-name">Name</Label>
                            <Input id="type-name" value={createTypeData.name} onChange={(e) => setCreateTypeData('name', e.target.value)} />
                            {createTypeErrors.name && <p className="text-destructive text-sm">{createTypeErrors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type-code">Code</Label>
                            <Input
                                id="type-code"
                                value={createTypeData.code}
                                onChange={(e) => setCreateTypeData('code', e.target.value.toUpperCase())}
                            />
                            {createTypeErrors.code && <p className="text-destructive text-sm">{createTypeErrors.code}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Input value={selectedCategoryForType?.name ?? ''} disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type-description">Description</Label>
                            <Input
                                id="type-description"
                                value={createTypeData.description}
                                onChange={(e) => setCreateTypeData('description', e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="type-is_active"
                                checked={createTypeData.is_active}
                                onCheckedChange={(checked) => setCreateTypeData('is_active', checked)}
                            />
                            <Label htmlFor="type-is_active">Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenCreateType(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateType}>Create Type</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openEditType} onOpenChange={setOpenEditType}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Deduction Type</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-type-name">Name</Label>
                            <Input id="edit-type-name" value={editTypeData.name} onChange={(e) => setEditTypeData('name', e.target.value)} />
                            {editTypeErrors.name && <p className="text-destructive text-sm">{editTypeErrors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-type-code">Code</Label>
                            <Input
                                id="edit-type-code"
                                value={editTypeData.code}
                                onChange={(e) => setEditTypeData('code', e.target.value.toUpperCase())}
                            />
                            {editTypeErrors.code && <p className="text-destructive text-sm">{editTypeErrors.code}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <CustomComboBox
                                items={allCategories.map((ac) => ({ value: String(ac.id), label: ac.name }))}
                                placeholder="-- none --"
                                value={editTypeData.category_id ? String(editTypeData.category_id) : null}
                                onSelect={(value) => setEditTypeData('category_id', value ? Number(value) : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-type-description">Description</Label>
                            <Input
                                id="edit-type-description"
                                value={editTypeData.description}
                                onChange={(e) => setEditTypeData('description', e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="edit-type-is_active"
                                checked={editTypeData.is_active}
                                onCheckedChange={(checked) => setEditTypeData('is_active', checked)}
                            />
                            <Label htmlFor="edit-type-is_active">Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenEditType(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!selectedType) return;
                                putType(route('deduction-types.update', selectedType.id), {
                                    onSuccess: () => {
                                        resetEditType();
                                        setOpenEditType(false);
                                        setSelectedType(null);
                                    },
                                });
                            }}
                        >
                            Update Type
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openDeleteType} onOpenChange={setOpenDeleteType}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Deduction Type</DialogTitle>
                    </DialogHeader>
                    <div className="">
                        Are you sure you want to delete the deduction type "{selectedTypeToDelete?.name}"? This action cannot be undone.
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpenDeleteType(false);
                                setSelectedTypeToDelete(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!selectedTypeToDelete) return;
                                router.delete(route('deduction-types.destroy', selectedTypeToDelete.id), {
                                    onSuccess: () => {
                                        toast.success('Deduction type deleted');
                                        setOpenDeleteType(false);
                                        setSelectedTypeToDelete(null);
                                    },
                                });
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
