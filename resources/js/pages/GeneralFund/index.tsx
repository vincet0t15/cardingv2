import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { FilterProps } from '@/types/filter';
import { GeneralFund } from '@/types/generalFund';
import { PaginatedDataResponse } from '@/types/pagination';
import { Head, router } from '@inertiajs/react';
import { ChevronDown, ChevronRight, PencilIcon, Plus, PlusIcon, Trash2 } from 'lucide-react';
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
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const queryString = search ? { search: search } : undefined;
            router.get(route('general-funds.index'), queryString, {
                preserveState: true,
                preserveScroll: true,
            });
        }
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="General Funds" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="General Funds" description="Manage general fund entries and their source of fund codes." />

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button onClick={() => setOpenCreateDialog(true)}>
                        <PlusIcon className="h-4 w-4" />
                        Add General Fund
                    </Button>

                    <div className="flex items-center gap-2">
                        <Input placeholder="Search..." value={search} onChange={handleSearch} onKeyDown={handleKeyDown} />
                    </div>
                </div>

                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary w-[400px] font-bold">General Fund</TableHead>
                                <TableHead className="text-primary font-bold">Description</TableHead>
                                <TableHead className="text-primary font-bold">Codes</TableHead>
                                <TableHead className="text-primary font-bold">Status</TableHead>
                                <TableHead className="text-primary text-right font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {generalFunds.data.length > 0 ? (
                                generalFunds.data.map((fund) => (
                                    <React.Fragment key={fund.id}>
                                        {/* General Fund Row */}
                                        <TableRow className="hover:bg-muted/50 text-sm font-medium transition-colors">
                                            <TableCell>
                                                <div
                                                    className="flex cursor-pointer items-center gap-2 select-none"
                                                    onClick={() => toggleFund(fund.id)}
                                                >
                                                    {expandedFunds.includes(fund.id) ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                                    )}
                                                    <code className="bg-muted rounded px-2 py-1 text-sm font-semibold">{fund.code}</code>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{fund.description || '-'}</TableCell>
                                            <TableCell>
                                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                    {fund.source_of_fund_codes_count} code{fund.source_of_fund_codes_count !== 1 ? 's' : ''}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs ${
                                                        fund.status
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                    }`}
                                                >
                                                    {fund.status ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                        onClick={() => handleClickAddCode(fund)}
                                                        title="Add Code"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                        onClick={() => handleClickEdit(fund)}
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => handleClickDelete(fund)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Source of Fund Codes Row */}
                                        {expandedFunds.includes(fund.id) && (
                                            <TableRow className="animate-in fade-in-0 zoom-in-95 bg-gray-50/50 text-sm duration-200">
                                                <TableCell colSpan={5}>
                                                    <div className="pl-6">
                                                        {fund.source_of_fund_codes && fund.source_of_fund_codes.length > 0 ? (
                                                            <div className="space-y-2 border-l-2 border-gray-300 pl-4">
                                                                {fund.source_of_fund_codes.map((code) => (
                                                                    <div
                                                                        key={code.id}
                                                                        className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                                            <code className="text-xs font-medium">{code.code}</code>
                                                                            <span className="text-muted-foreground text-xs">
                                                                                {code.description || 'No description'}
                                                                            </span>
                                                                            {code.is_category && (
                                                                                <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                                                                                    Category
                                                                                </span>
                                                                            )}
                                                                            <span
                                                                                className={`rounded-full px-1.5 py-0.5 text-xs ${
                                                                                    code.status
                                                                                        ? 'bg-green-100 text-green-700'
                                                                                        : 'bg-red-100 text-red-700'
                                                                                }`}
                                                                            >
                                                                                {code.status ? 'Active' : 'Inactive'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                                                onClick={() => handleClickEditCode(code)}
                                                                                title="Edit"
                                                                            >
                                                                                <PencilIcon className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                                onClick={() => handleClickDeleteCode(code)}
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-muted-foreground flex items-center justify-center py-4 text-xs">
                                                                No source of fund codes yet. Click "Add Code" to create one.
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
                                    <TableCell colSpan={5} className="py-3 text-center text-gray-500">
                                        No data available.
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
