import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Key, PencilIcon, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

interface PermissionsIndexProps {
    permissions: Permission[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles & Permissions',
        href: '/roles',
    },
    {
        title: 'Permissions',
        href: '/permissions',
    },
];

export default function PermissionsIndex({ permissions }: PermissionsIndexProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
    const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null);

    const createForm = useForm({
        name: '',
    });

    const editForm = useForm({
        name: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('permissions.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const openEditDialog = (permission: Permission) => {
        setEditingPermission(permission);
        editForm.setData('name', permission.name);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPermission) return;

        editForm.put(route('permissions.update', editingPermission.id), {
            onSuccess: () => {
                setEditingPermission(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingPermission) return;

        router.delete(route('permissions.destroy', deletingPermission.id), {
            onSuccess: () => setDeletingPermission(null),
        });
    };

    const groupedPermissions = permissions.reduce(
        (acc, permission) => {
            const category = permission.name.split('.')[0] || 'other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(permission);
            return acc;
        },
        {} as Record<string, Permission[]>,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <Heading title="Permissions" description="Manage system permissions" />
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Permission
                    </Button>
                </div>

                {/* Permissions Table by Category */}
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="space-y-3">
                        <h3 className="text-lg font-semibold capitalize">{category.replace(/_/g, ' ')}</h3>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Permission Name</TableHead>
                                        <TableHead>Guard</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {perms.map((permission) => (
                                        <TableRow key={permission.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                                                        <Key className="text-primary h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium">{permission.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{permission.guard_name}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                        onClick={() => openEditDialog(permission)}
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => setDeletingPermission(permission)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}

                {permissions.length === 0 && (
                    <div className="text-muted-foreground py-12 text-center">No permissions found. Create your first permission to get started.</div>
                )}

                {/* Create Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Permission</DialogTitle>
                            <DialogDescription>
                                Create a new permission. Use dot notation for categories (e.g., employees.create, employees.edit)
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Permission Name</Label>
                                <Input
                                    id="name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="e.g., employees.create"
                                />
                                {createForm.errors.name && <p className="text-destructive text-sm">{createForm.errors.name}</p>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createForm.processing}>
                                    Create Permission
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={!!editingPermission} onOpenChange={() => setEditingPermission(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Permission</DialogTitle>
                            <DialogDescription>Update the permission name</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Permission Name</Label>
                                <Input id="edit-name" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                {editForm.errors.name && <p className="text-destructive text-sm">{editForm.errors.name}</p>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingPermission(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editForm.processing}>
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={!!deletingPermission} onOpenChange={() => setDeletingPermission(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Permission</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the permission "{deletingPermission?.name}
                                "? This will remove it from all roles. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeletingPermission(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
