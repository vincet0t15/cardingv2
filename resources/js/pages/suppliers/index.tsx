import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { PaginatedDataResponse } from '@/types/pagination';
import { Supplier } from '@/types/supplier';
import { Head, Link, router } from '@inertiajs/react';
import { PlusIcon, Search, Users, Edit, Trash2, Eye, Trash } from 'lucide-react';
import { useState } from 'react';
import { CreateSupplierDialog } from './create-dialog';
import { DeleteSupplierDialog } from './delete-dialog';
import { EditSupplierDialog } from './edit-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    suppliers: PaginatedDataResponse<Supplier>;
    filters: {
        search: string;
    };
}

export default function Suppliers({ suppliers, filters }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const breadcrumbs = [{ title: 'Suppliers', href: '/suppliers' }];

    const handleSearch = () => {
        router.get(route('suppliers.index'), { search: search || undefined }, { preserveState: true, preserveScroll: true });
    };

    // Summary counts (current page)
    const totalSuppliers = suppliers.total;
    const activeCount = suppliers.data.filter((s) => s.is_active).length;
    const inactiveCount = suppliers.data.length - activeCount;

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-PH').format(num);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Suppliers" description="Manage suppliers — view transactions, edit details, and keep supplier records up to date." />

                {/* Summary Cards (copied from Employee layout for identical responsive behavior) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-50">Total Suppliers</CardTitle>
                            <Users className="h-4 w-4 text-emerald-100" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatNumber(totalSuppliers)}</div>
                            <p className="text-xs text-emerald-50/80">All suppliers</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-sky-50">Active (page)</CardTitle>
                            <Users className="text-sky-100 h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatNumber(activeCount)}</div>
                            <p className="text-xs text-sky-50/80">Active suppliers (this page)</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-50">Inactive (page)</CardTitle>
                            <Users className="text-orange-100 h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatNumber(inactiveCount)}</div>
                            <p className="text-xs text-orange-50/80">Inactive suppliers (this page)</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-violet-50">This Page</CardTitle>
                            <Users className="text-violet-100 h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatNumber(suppliers.data.length)} <span className="text-sm">/</span> {formatNumber(suppliers.per_page)}</div>
                            <p className="text-xs text-violet-50/80">Showing rows on this page</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Instruction Note (same as employee page) */}
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-teal-800 shadow-sm">
                    <div className="flex items-start gap-3">
                        <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm">
                            <p className="mb-1 font-semibold">Quick Tip</p>
                            <p className="text-teal-700">Click a supplier row to open their transactions and manage records.</p>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-emerald-600 transition-colors hover:bg-emerald-700">
                        <PlusIcon className="h-4 w-4" />
                        Add Supplier
                    </Button>

                    <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:items-center">
                        <div className="relative w-full lg:w-[360px]">
                            <Input
                                id="search"
                                placeholder="Search suppliers..."
                                className="w-full rounded-full pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => setSearch('')}>Clear</Button>
                        </div>
                    </div>
                </div>

                {/* Desktop table (hidden on small screens) */}
                <div className="hidden lg:block w-full overflow-hidden rounded-lg border bg-white shadow">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-52">Supplier</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="hidden md:table-cell">Contact</TableHead>
                                <TableHead className="hidden lg:table-cell">Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-36">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-muted-foreground py-12 text-center">
                                        No suppliers found. Click "Add Supplier" to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                suppliers.data.map((supplier) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
                                                {supplier.name?.charAt(0).toUpperCase() || '-'}
                                            </div>
                                            <div>
                                                <Link href={route('suppliers.transactions.show', supplier.id)} className="font-medium hover:underline">
                                                    {supplier.name}
                                                </Link>
                                                <div className="text-xs text-muted-foreground">{supplier.owner_name || ''}</div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-muted-foreground">{supplier.owner_name || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">{supplier.address || '-'}</TableCell>
                                        <TableCell className="hidden md:table-cell">{supplier.contact_number || '-'}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{supplier.email || '-'}</TableCell>

                                        <TableCell>
                                            <Badge variant={supplier.is_active ? 'secondary' : 'destructive'} className="rounded-sm">
                                                {supplier.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => router.get(route('suppliers.transactions.show', supplier.id))}>
                                                <Eye className="h-4 w-4 text-slate-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setEditingSupplier(supplier)}>
                                                <Edit className="h-4 w-4 text-teal-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeletingSupplier(supplier)}>
                                                <Trash className="h-4 w-4 text-orange-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile list (visible on small screens) */}
                <div className="block lg:hidden w-full">
                    {suppliers.data.length === 0 ? (
                        <div className="rounded-lg border bg-white p-6 text-center text-muted-foreground">No suppliers found. Click "Add Supplier" to create one.</div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {suppliers.data.map((supplier) => (
                                <div key={supplier.id} className="rounded-lg border bg-white p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
                                            {supplier.name?.charAt(0).toUpperCase() || '-'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="truncate font-medium text-sm">
                                                    <Link href={route('suppliers.transactions.show', supplier.id)} className="hover:underline">
                                                        {supplier.name}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground">{supplier.owner_name || ''}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={supplier.is_active ? 'secondary' : 'destructive'} className="rounded-sm text-xs">
                                                        {supplier.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="mt-2 text-sm text-muted-foreground">
                                                <div className="truncate">{supplier.address || '-'}</div>
                                                <div className="mt-1 flex items-center gap-3 text-xs">
                                                    <span className="hidden md:inline">{supplier.contact_number || '-'}</span>
                                                    <span className="hidden md:inline">{supplier.email || '-'}</span>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => router.get(route('suppliers.transactions.show', supplier.id))}>
                                                    <Eye className="h-4 w-4 text-slate-600" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setEditingSupplier(supplier)}>
                                                    <Edit className="h-4 w-4 text-teal-600" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setDeletingSupplier(supplier)}>
                                                    <Trash className="h-4 w-4 text-orange-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {suppliers.data.length > 0 && <Pagination data={suppliers} />}
            </div>

            <CreateSupplierDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            <EditSupplierDialog supplier={editingSupplier} onClose={() => setEditingSupplier(null)} />
            <DeleteSupplierDialog supplier={deletingSupplier} onClose={() => setDeletingSupplier(null)} />
        </AppLayout>
    );
}
