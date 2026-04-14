import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { FilterProps } from '@/types/filter';
import { GeneralFund } from '@/types/generalFund';
import { PaginatedDataResponse } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { ChevronDown, ChevronRight, FileText, Hash, PencilIcon, PlusIcon, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { CreateSourceOfFundCode } from '../SourceOfFundCode/create';
import { DeleteSourceOfFundCode } from '../SourceOfFundCode/delete';
import { EditSourceOfFundCodeDialog } from '../SourceOfFundCode/edit';
import { GeneralFundCreateDialog } from './create';
import { DeleteGeneralFundDialog } from './delete';
import { GeneralFundEditDialog } from './edit';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Funds',
        href: '/general-funds',
    },
];

interface SourceOfFundCodeChild {
    id: number;
    code: string;
    description: string | null;
    status: boolean;
    is_category: boolean;
    parent_id: number | null;
    general_fund_id: number | null;
}

interface GeneralFundWithCodes extends GeneralFund {
    source_of_fund_codes: SourceOfFundCodeChild[];
}

interface GeneralFundPageProps {
    generalFunds: PaginatedDataResponse<GeneralFundWithCodes>;
    filters: FilterProps;
}

export default function GeneralFundIndex({ generalFunds, filters }: GeneralFundPageProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [dataToEdit, setDataEdit] = useState<GeneralFund | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [dataToDelete, setDataDelete] = useState<GeneralFund | null>(null);
    const [expandedFunds, setExpandedFunds] = useState<number[]>([]);
    const [openCreateCodeDialog, setOpenCreateCodeDialog] = useState(false);
    const [selectedFundForCode, setSelectedFundForCode] = useState<GeneralFund | null>(null);
    const [openEditCodeDialog, setOpenEditCodeDialog] = useState(false);
    const [dataToEditCode, setDataEditCode] = useState<SourceOfFundCodeChild | null>(null);
    const [openDeleteCodeDialog, setOpenDeleteCodeDialog] = useState(false);
    const [dataToDeleteCode, setDataDeleteCode] = useState<SourceOfFundCodeChild | null>(null);

    const toggleFund = (id: number) => {
        setExpandedFunds((prev) => (prev.includes(id) ? prev.filter((expandedId) => expandedId !== id) : [...prev, id]));
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        // Auto-apply search
        const queryString = e.target.value ? { search: e.target.value } : undefined;
        router.get(route('general-funds.index'), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClickEdit = (fund: GeneralFund) => {
        setDataEdit(fund);
        setOpenEditDialog(true);
    };

    const handleClickDelete = (fund: GeneralFund) => {
        setDataDelete(fund);
        setOpenDeleteDialog(true);
    };

    const handleClickAddCode = (fund: GeneralFund) => {
        setSelectedFundForCode(fund);
        setOpenCreateCodeDialog(true);
    };

    const handleClickEditCode = (code: SourceOfFundCodeChild) => {
        setDataEditCode(code);
        setOpenEditCodeDialog(true);
    };

    const handleClickDeleteCode = (code: SourceOfFundCodeChild) => {
        setDataDeleteCode(code);
        setOpenDeleteCodeDialog(true);
    };

    // Calculate totals for summary cards
    const totalFunds = generalFunds.total;
    const totalActive = generalFunds.data.filter((f) => f.status).length;
    const totalInactive = generalFunds.data.length - totalActive;
    const totalCodes = generalFunds.data.reduce((sum, fund) => sum + (fund.source_of_fund_codes_count || 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="General Funds" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="General Funds" description="Manage general fund entries and their source of fund codes." />

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
                            <FileText className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalFunds}</div>
                            <p className="text-muted-foreground text-xs">General funds</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
                            <Hash className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCodes}</div>
                            <p className="text-muted-foreground text-xs">Source of fund codes</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Funds</CardTitle>
                            <div className="h-4 w-4 rounded-full bg-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{totalActive}</div>
                            <p className="text-muted-foreground text-xs">Currently active</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive Funds</CardTitle>
                            <div className="h-4 w-4 rounded-full bg-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{totalInactive}</div>
                            <p className="text-muted-foreground text-xs">Currently inactive</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Bar */}
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button onClick={() => setOpenCreateDialog(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add General Fund
                    </Button>

                    <div className="flex items-center gap-2">
                        <Input placeholder="Search funds..." className="w-full sm:w-[300px]" value={search} onChange={handleSearch} />
                    </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary w-[450px] font-bold">General Fund</TableHead>
                                <TableHead className="text-primary font-bold">Description</TableHead>
                                <TableHead className="text-primary text-center font-bold">Source Codes</TableHead>
                                <TableHead className="text-primary text-center font-bold">Status</TableHead>
                                <TableHead className="text-primary text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {generalFunds.data.length > 0 ? (
                                generalFunds.data.map((fund) => (
                                    <React.Fragment key={fund.id}>
                                        {/* General Fund Row */}
                                        <TableRow className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div
                                                    className="flex cursor-pointer items-center gap-2 select-none"
                                                    onClick={() => toggleFund(fund.id)}
                                                >
                                                    {expandedFunds.includes(fund.id) ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-500 transition-transform" />
                                                    )}
                                                    <code className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                        {fund.code}
                                                    </code>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-[300px] truncate">
                                                {fund.description || <span className="text-gray-400 italic">No description</span>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-medium">
                                                    {fund.source_of_fund_codes_count} {fund.source_of_fund_codes_count === 1 ? 'code' : 'codes'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={fund.status ? 'default' : 'destructive'}
                                                    className={fund.status ? 'bg-green-600 hover:bg-green-600' : ''}
                                                >
                                                    {fund.status ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30"
                                                        onClick={() => handleClickAddCode(fund)}
                                                        title="Add Source Code"
                                                    >
                                                        <PlusIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/30"
                                                        onClick={() => handleClickEdit(fund)}
                                                        title="Edit Fund"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30"
                                                        onClick={() => handleClickDelete(fund)}
                                                        title="Delete Fund"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Source of Fund Codes Row */}
                                        {expandedFunds.includes(fund.id) && (
                                            <TableRow className="animate-in fade-in-0 zoom-in-95 bg-gradient-to-r from-blue-50/50 to-purple-50/30 text-sm duration-200 dark:from-blue-900/10 dark:to-purple-900/10">
                                                <TableCell colSpan={5}>
                                                    <div className="py-3 pl-8">
                                                        {fund.source_of_fund_codes && fund.source_of_fund_codes.length > 0 ? (
                                                            <div className="space-y-2">
                                                                <div className="mb-3 flex items-center gap-2">
                                                                    <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                                                                    <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                                                                        {fund.source_of_fund_codes.length} Source Code
                                                                        {fund.source_of_fund_codes.length !== 1 ? 's' : ''}
                                                                    </span>
                                                                    <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                                                                </div>
                                                                <div className="grid gap-2">
                                                                    {fund.source_of_fund_codes.map((code) => (
                                                                        <div
                                                                            key={code.id}
                                                                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                                                        >
                                                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                                <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                                                                                <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                                                                    {code.code}
                                                                                </code>
                                                                                <span className="text-muted-foreground truncate text-xs">
                                                                                    {code.description || 'No description'}
                                                                                </span>
                                                                                {code.is_category && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="flex-shrink-0 border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                                                                                    >
                                                                                        Category
                                                                                    </Badge>
                                                                                )}
                                                                                <Badge
                                                                                    variant={code.status ? 'default' : 'destructive'}
                                                                                    className={`flex-shrink-0 text-xs ${code.status ? 'bg-green-600 hover:bg-green-600' : ''}`}
                                                                                >
                                                                                    {code.status ? 'Active' : 'Inactive'}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="ml-2 flex flex-shrink-0 items-center gap-1">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/30"
                                                                                    onClick={() => handleClickEditCode(code)}
                                                                                    title="Edit Code"
                                                                                >
                                                                                    <PencilIcon className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30"
                                                                                    onClick={() => handleClickDeleteCode(code)}
                                                                                    title="Delete Code"
                                                                                >
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                                <Hash className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-600" />
                                                                <p className="text-muted-foreground text-sm font-medium">
                                                                    No source of fund codes yet
                                                                </p>
                                                                <p className="text-muted-foreground mt-1 text-xs">
                                                                    Click "Add Code" to create your first source code
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <FileText className="mb-3 h-16 w-16 text-gray-300 dark:text-gray-600" />
                                            <p className="text-muted-foreground text-lg font-semibold">No general funds found</p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {search ? 'Try adjusting your search' : 'Get started by adding your first general fund'}
                                            </p>
                                            {!search && (
                                                <Button onClick={() => setOpenCreateDialog(true)} className="mt-4">
                                                    <PlusIcon className="mr-2 h-4 w-4" />
                                                    Add General Fund
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div>
                    <Pagination data={generalFunds} />
                </div>
            </div>

            {openCreateDialog && <GeneralFundCreateDialog open={openCreateDialog} setOpen={setOpenCreateDialog} />}

            {openEditDialog && dataToEdit && <GeneralFundEditDialog open={openEditDialog} setOpen={setOpenEditDialog} generalFund={dataToEdit} />}

            {openDeleteDialog && dataToDelete && (
                <DeleteGeneralFundDialog open={openDeleteDialog} setOpen={setOpenDeleteDialog} dataToDelete={dataToDelete} />
            )}

            {openCreateCodeDialog && selectedFundForCode && (
                <CreateSourceOfFundCode
                    open={openCreateCodeDialog}
                    onClose={() => {
                        setOpenCreateCodeDialog(false);
                        setSelectedFundForCode(null);
                    }}
                    defaultGeneralFundId={selectedFundForCode.id}
                />
            )}

            {openEditCodeDialog && dataToEditCode && (
                <EditSourceOfFundCodeDialog
                    open={openEditCodeDialog}
                    onClose={() => {
                        setOpenEditCodeDialog(false);
                        setDataEditCode(null);
                    }}
                    sourceOfFundCode={dataToEditCode}
                />
            )}

            {openDeleteCodeDialog && dataToDeleteCode && (
                <DeleteSourceOfFundCode
                    isOpen={openDeleteCodeDialog}
                    onClose={() => {
                        setOpenDeleteCodeDialog(false);
                        setDataDeleteCode(null);
                    }}
                    sourceOfFundCode={dataToDeleteCode}
                />
            )}
        </AppLayout>
    );
}
