import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { FilterProps } from '@/types/filter';
import { GeneralFund } from '@/types/generalFund';
import { PaginatedDataResponse } from '@/types/pagination';
import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Hash,
    Minus,
    PencilIcon,
    PlusIcon,
    Search,
    Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { CreateSourceOfFundCode } from '../SourceOfFundCode/create';
import { DeleteSourceOfFundCode } from '../SourceOfFundCode/delete';
import { EditSourceOfFundCodeDialog } from '../SourceOfFundCode/edit';
import { GeneralFundCreateDialog } from './create';
import { DeleteGeneralFundDialog } from './delete';
import { GeneralFundEditDialog } from './edit';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Funds', href: '/general-funds' },
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

function StatCard({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    accent: 'blue' | 'emerald' | 'amber' | 'rose';
}) {
    const colorMap = {
        blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50',
        emerald: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50',
        amber: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50',
        rose: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/50',
    };

    return (
        <Card className="border border-slate-200 shadow-sm dark:border-slate-700">
            <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[accent]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
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

    const totalFunds = generalFunds.total;
    const totalActive = generalFunds.data.filter((f) => f.status).length;
    const totalInactive = generalFunds.data.length - totalActive;
    const totalCodes = generalFunds.data.reduce((sum, fund) => sum + (fund.source_of_fund_codes_count || 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="General Funds" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">General Funds</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage general fund entries and their source of fund codes.</p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Funds" value={totalFunds} icon={FileText} accent="blue" />
                    <StatCard label="Source Codes" value={totalCodes} icon={Hash} accent="emerald" />
                    <StatCard label="Active" value={totalActive} icon={Minus} accent="amber" />
                    <StatCard label="Inactive" value={totalInactive} icon={Minus} accent="rose" />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button onClick={() => setOpenCreateDialog(true)} className="w-fit">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add General Fund
                    </Button>

                    <div className="relative w-full sm:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search funds..."
                            className="pl-9"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow>
                                <TableHead className="w-[350px] font-semibold text-slate-700 dark:text-slate-300">Fund</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Description</TableHead>
                                <TableHead className="w-28 text-center font-semibold text-slate-700 dark:text-slate-300">Codes</TableHead>
                                <TableHead className="w-24 text-center font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                                <TableHead className="w-36 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {generalFunds.data.length > 0 ? (
                                generalFunds.data.map((fund) => (
                                    <React.Fragment key={fund.id}>
                                        {/* Main Row */}
                                        <TableRow
                                            className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                            onClick={() => toggleFund(fund.id)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    {expandedFunds.includes(fund.id) ? (
                                                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                                                    )}
                                                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-mono text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                        {fund.code}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[280px] truncate text-slate-600 dark:text-slate-400">
                                                {fund.description || <span className="italic text-slate-400">No description</span>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    <Hash className="h-3 w-3" />
                                                    {fund.source_of_fund_codes_count}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        fund.status
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            fund.status ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`}
                                                    />
                                                    {fund.status ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                                        onClick={() => handleClickAddCode(fund)}
                                                        title="Add Source Code"
                                                    >
                                                        <PlusIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                                        onClick={() => handleClickEdit(fund)}
                                                        title="Edit Fund"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                        onClick={() => handleClickDelete(fund)}
                                                        title="Delete Fund"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Codes — Nested Table */}
                                        {expandedFunds.includes(fund.id) && (
                                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/20">
                                                <TableCell colSpan={5} className="p-0">
                                                    <div className="border-t border-slate-100 dark:border-slate-700">
                                                        {fund.source_of_fund_codes && fund.source_of_fund_codes.length > 0 ? (
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wider text-slate-400 dark:border-slate-700">
                                                                        <th className="px-6 py-2.5">Code</th>
                                                                        <th className="px-6 py-2.5">Description</th>
                                                                        <th className="w-24 px-6 py-2.5 text-center">Type</th>
                                                                        <th className="w-24 px-6 py-2.5 text-center">Status</th>
                                                                        <th className="w-24 px-6 py-2.5 text-right">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {fund.source_of_fund_codes.map((code) => (
                                                                        <tr
                                                                            key={code.id}
                                                                            className="border-b border-slate-50 text-sm transition-colors hover:bg-white/60 dark:border-slate-800 dark:hover:bg-slate-800/40"
                                                                        >
                                                                            <td className="px-6 py-2.5">
                                                                                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                                                    {code.code}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-6 py-2.5 text-slate-600 dark:text-slate-400">
                                                                                {code.description || (
                                                                                    <span className="italic text-slate-400">No description</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-6 py-2.5 text-center">
                                                                                {code.is_category ? (
                                                                                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                                                                        Category
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-xs text-slate-400">—</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-6 py-2.5 text-center">
                                                                                <span
                                                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                                        code.status
                                                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                                                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                                                                    }`}
                                                                                >
                                                                                    <span
                                                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                                                            code.status ? 'bg-emerald-500' : 'bg-rose-500'
                                                                                        }`}
                                                                                    />
                                                                                    {code.status ? 'Active' : 'Inactive'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-6 py-2.5 text-right">
                                                                                <div className="flex justify-end gap-1">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-7 w-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                                                                        onClick={() => handleClickEditCode(code)}
                                                                                        title="Edit Code"
                                                                                    >
                                                                                        <PencilIcon className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                                                        onClick={() => handleClickDeleteCode(code)}
                                                                                        title="Delete Code"
                                                                                    >
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <div className="flex flex-col items-center py-8 text-center">
                                                                <Hash className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
                                                                <p className="text-sm font-medium text-slate-500">No source codes yet</p>
                                                                <p className="mt-0.5 text-xs text-slate-400">
                                                                    Click the <strong>+</strong> button above to create one
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
                                    <TableCell colSpan={5} className="py-16">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                <FileText className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                                                No general funds found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {search
                                                    ? 'Try adjusting your search terms'
                                                    : 'Get started by adding your first general fund'}
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

                {/* Pagination */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <p>
                        Showing <strong className="text-slate-700 dark:text-slate-300">{generalFunds.from}</strong> to{' '}
                        <strong className="text-slate-700 dark:text-slate-300">{generalFunds.to}</strong> of{' '}
                        <strong className="text-slate-700 dark:text-slate-300">{generalFunds.total}</strong>
                    </p>
                    <div className="flex gap-1">
                        {generalFunds.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url ?? '#'}
                                preserveState
                                preserveScroll
                                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                                    link.active
                                        ? 'border-slate-800 bg-slate-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Dialogs */}
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
