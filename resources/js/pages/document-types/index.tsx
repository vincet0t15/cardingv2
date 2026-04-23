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
import type { DocumentType } from '@/types/documentType';
import type { FilterProps } from '@/types/filter';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { PencilIcon, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
    },
    {
        title: 'Document Types',
        href: '/settings/document-types',
    },
];

interface DocumentTypesProps {
    documentTypes: PaginatedDataResponse<DocumentType>;
    filters: FilterProps;
}

export default function DocumentTypesIndex({ documentTypes, filters }: DocumentTypesProps) {
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);

    const { data: searchData, setData: setSearchData } = useForm({
        search: filters.search || '',
    });

    const {
        data: formData,
        setData: setFormData,
        post,
        put,
        delete: destroy,
        reset,
        errors,
        processing,
    } = useForm<{
        name: string;
        code: string;
        description: string;
        is_active: boolean;
    }>({
        name: '',
        code: '',
        description: '',
        is_active: true as boolean,
    });

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const queryString = searchData.search ? { search: searchData.search } : {};
            router.get(route('document-types.index'), queryString, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const handleOpenAdd = () => {
        reset();
        setOpenAdd(true);
    };

    const handleOpenEdit = (documentType: DocumentType) => {
        setSelectedDocumentType(documentType);
        setFormData({
            name: documentType.name,
            code: documentType.code,
            description: documentType.description || '',
            is_active: documentType.is_active,
        });
        setOpenEdit(true);
    };

    const handleOpenDelete = (documentType: DocumentType) => {
        setSelectedDocumentType(documentType);
        setOpenDelete(true);
    };

    const handleAdd = () => {
        post(route('document-types.store'), {
            onSuccess: () => {
                reset();
                setOpenAdd(false);
            },
        });
    };

    const handleEdit = () => {
        if (!selectedDocumentType) return;
        put(route('document-types.update', selectedDocumentType.id), {
            onSuccess: () => {
                reset();
                setOpenEdit(false);
                setSelectedDocumentType(null);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedDocumentType) return;
        destroy(route('document-types.destroy', selectedDocumentType.id), {
            onSuccess: () => {
                setOpenDelete(false);
                setSelectedDocumentType(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Document Types" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Document Types" description="Manage document categories and types for employee records." />

                {/* Toolbar */}
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <div className="relative w-full sm:w-[300px]">
                            <Input
                                placeholder="Search document types..."
                                className="w-full pl-10"
                                value={searchData.search}
                                onChange={(e) => setSearchData('search', e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-50" />
                        </div>
                    </div>
                    <Button onClick={handleOpenAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Document Type
                    </Button>
                </div>

                {/* Table */}
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
                        <TableBody>
                            {documentTypes.data.length > 0 ? (
                                documentTypes.data.map((documentType) => (
                                    <TableRow key={documentType.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{documentType.name}</TableCell>
                                        <TableCell>
                                            <code className="bg-muted rounded px-2 py-1 text-sm">{documentType.code}</code>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-w-[300px] truncate">
                                            {documentType.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    documentType.is_active
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                }`}
                                            >
                                                {documentType.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(documentType)}>
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleOpenDelete(documentType)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                                        No document types found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination data={documentTypes} />

                {/* Add Dialog */}
                <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Document Type</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData('name', e.target.value)}
                                    placeholder="e.g., Purchase Request"
                                />
                                {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="code">Code</Label>
                                <Input id="code" value={formData.code} onChange={(e) => setFormData('code', e.target.value)} placeholder="e.g., PR" />
                                {errors.code && <p className="text-destructive text-sm">{errors.code}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData('description', e.target.value)}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenAdd(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAdd} disabled={processing}>
                                Add Document Type
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Document Type</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData('name', e.target.value)} />
                                {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-code">Code</Label>
                                <Input id="edit-code" value={formData.code} onChange={(e) => setFormData('code', e.target.value)} />
                                {errors.code && <p className="text-destructive text-sm">{errors.code}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData('description', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="edit-is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData('is_active', checked)}
                                />
                                <Label htmlFor="edit-is_active">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenEdit(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEdit} disabled={processing}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Document Type</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p>
                                Are you sure you want to delete <strong>{selectedDocumentType?.name}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenDelete(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
