import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { PencilIcon, Plus, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
    permissions: string[];
    permissions_count: number;
}

interface RolesIndexProps {
    roles: Role[];
    permissions: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles & Permissions',
        href: '/roles',
    },
];

export default function RolesIndex({ roles, permissions }: RolesIndexProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);

    const createForm = useForm({
        name: '',
        permissions: [] as string[],
    });

    const editForm = useForm({
        name: '',
        permissions: [] as string[],
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('roles.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const openEditDialog = (role: Role) => {
        setEditingRole(role);
        editForm.setData({
            name: role.name,
            permissions: role.permissions,
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;

        editForm.put(route('roles.update', editingRole.id), {
            onSuccess: () => {
                setEditingRole(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingRole) return;

        router.delete(route('roles.destroy', deletingRole.id), {
            onSuccess: () => setDeletingRole(null),
        });
    };

    const togglePermission = (form: typeof createForm | typeof editForm, permission: string) => {
        const current = form.data.permissions;
        const updated = current.includes(permission) ? current.filter((p) => p !== permission) : [...current, permission];
        form.setData('permissions', updated);
    };

    const toggleCategoryPermissions = (form: typeof createForm | typeof editForm, category: string, perms: string[]) => {
        const current = form.data.permissions;
        const allSelected = perms.every((p) => current.includes(p));

        if (allSelected) {
            // Remove all permissions in this category
            const updated = current.filter((p) => !perms.includes(p));
            form.setData('permissions', updated);
        } else {
            // Add all permissions in this category
            const updated = [...new Set([...current, ...perms])];
            form.setData('permissions', updated);
        }
    };

    const isCategoryFullySelected = (form: typeof createForm | typeof editForm, perms: string[]) => {
        return perms.length > 0 && perms.every((p) => form.data.permissions.includes(p));
    };

    const isCategoryPartiallySelected = (form: typeof createForm | typeof editForm, perms: string[]) => {
        const selectedCount = perms.filter((p) => form.data.permissions.includes(p)).length;
        return selectedCount > 0 && selectedCount < perms.length;
    };

    const CATEGORY_LABELS: Record<string, string> = {
        claims: 'Employee Claims',
        adjustments: 'Employee Adjustments',
        'employee-deductions': 'Employee Deductions',
    };

    const getCategoryLabel = (category: string) => {
        return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ');
    };

    const groupedPermissions = permissions.reduce(
        (acc, permission) => {
            const category = permission.split('.')[0] || 'other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(permission);
            return acc;
        },
        {} as Record<string, string[]>,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles & Permissions" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <Heading title="Roles & Permissions" description="Manage system roles and their permissions" />
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Role
                    </Button>
                </div>

                {/* Roles Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                                        No roles found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                                                    <Shield className="text-primary h-4 w-4" />
                                                </div>
                                                <span className="font-medium capitalize">{role.name.replace(/_/g, ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground text-sm">{role.permissions_count} permissions</span>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {role.permissions.slice(0, 3).map((perm) => (
                                                    <span key={perm} className="bg-muted rounded px-2 py-0.5 text-xs">
                                                        {perm}
                                                    </span>
                                                ))}
                                                {role.permissions.length > 3 && (
                                                    <span className="text-muted-foreground text-xs">+{role.permissions.length - 3} more</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(role)}>
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                {role.name !== 'super admin' && (
                                                    <Button variant="ghost" size="icon" onClick={() => setDeletingRole(role)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Create Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-h-[90vh] min-w-3xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Role</DialogTitle>
                            <DialogDescription>Create a new role and assign permissions</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input
                                    id="name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="e.g., hr_manager"
                                />
                                {createForm.errors.name && <p className="text-destructive text-sm">{createForm.errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Permissions</Label>
                                <div className="space-y-4 rounded-md border p-4">
                                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                                        <div key={category}>
                                            <div className="mb-2 flex items-center justify-between">
                                                <h4 className="text-sm font-semibold">{getCategoryLabel(category)}</h4>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`select-all-${category}`}
                                                        checked={isCategoryFullySelected(createForm, perms)}
                                                        onCheckedChange={() => toggleCategoryPermissions(createForm, category, perms)}
                                                    />
                                                    <Label htmlFor={`select-all-${category}`} className="text-muted-foreground text-xs font-normal">
                                                        Select All
                                                    </Label>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {perms.map((permission) => (
                                                    <div key={permission} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`create-${permission}`}
                                                            checked={createForm.data.permissions.includes(permission)}
                                                            onCheckedChange={() => togglePermission(createForm, permission)}
                                                        />
                                                        <Label htmlFor={`create-${permission}`} className="text-sm font-normal">
                                                            {permission}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createForm.processing}>
                                    Create Role
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
                    <DialogContent className="max-h-[90vh] min-w-3xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Role</DialogTitle>
                            <DialogDescription>Update role name and permissions</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Role Name</Label>
                                <Input id="edit-name" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                {editForm.errors.name && <p className="text-destructive text-sm">{editForm.errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Permissions</Label>
                                <div className="space-y-4 rounded-md border p-4">
                                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                                        <div key={category}>
                                            <div className="mb-2 flex items-center justify-between">
                                                <h4 className="text-sm font-semibold">{getCategoryLabel(category)}</h4>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`edit-select-all-${category}`}
                                                        checked={isCategoryFullySelected(editForm, perms)}
                                                        onCheckedChange={() => toggleCategoryPermissions(editForm, category, perms)}
                                                    />
                                                    <Label
                                                        htmlFor={`edit-select-all-${category}`}
                                                        className="text-muted-foreground text-xs font-normal"
                                                    >
                                                        Select All
                                                    </Label>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {perms.map((permission) => (
                                                    <div key={permission} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`edit-${permission}`}
                                                            checked={editForm.data.permissions.includes(permission)}
                                                            onCheckedChange={() => togglePermission(editForm, permission)}
                                                        />
                                                        <Label htmlFor={`edit-${permission}`} className="text-sm font-normal">
                                                            {permission}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>
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
                <Dialog open={!!deletingRole} onOpenChange={() => setDeletingRole(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Role</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the role "{deletingRole?.name}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeletingRole(null)}>
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
