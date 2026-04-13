import { CustomComboBox } from '@/components/CustomComboBox';
import Pagination from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Claim, ClaimFilters } from '@/types/claim';
import type { ClaimType } from '@/types/claimType';
import type { Employee } from '@/types/employee';
import { PaginatedDataResponse } from '@/types/pagination';
import { router } from '@inertiajs/react';
import { PencilIcon, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { CreateClaimDialog } from './create';
import { DeleteClaimDialog } from './delete';
import { EditClaimDialog } from './edit';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ClaimsProps {
    employee: Employee;
    claims?: PaginatedDataResponse<Claim>;
    claimTypes: ClaimType[];
    availableYears: number[];
    filters: ClaimFilters;
}

interface DialogState {
    open: boolean;
    claim: Claim | null;
}

export function EmployeeClaims({ employee, claims, claimTypes, availableYears, filters }: ClaimsProps) {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [editDialogState, setEditDialogState] = useState<DialogState>({ open: false, claim: null });
    const claimsData = claims || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 20,
        from: 0,
        to: 0,
        path: '',
        links: [],
    };
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const applyFilter = (newFilters: Partial<ClaimFilters>) => {
        router.get(route('manage.employees.claims.index', employee.id), { ...filters, ...newFilters }, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        router.get(route('manage.employees.claims.index', employee.id), {}, { preserveState: true, preserveScroll: true });
    };

    const openEditDialog = (claim: Claim) => {
        setEditDialogState({ open: true, claim });
    };

    const OnclickDelete = (claim: Claim) => {
        setSelectedClaim(claim);
        setOpenDeleteDialog(true);
    };
    const closeEditDialog = () => {
        setEditDialogState({ open: false, claim: null });
    };

    const handleDelete = (claim: Claim) => {
        if (confirm('Are you sure you want to delete this claim?')) {
            router.delete(route('manage.employees.claims.destroy', [employee.id, claim.id]));
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const hasActiveFilters = filters.claim_month || filters.claim_year || filters.claim_type_id;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <CustomComboBox
                    items={MONTHS.map((month, index) => ({ value: String(index + 1), label: month }))}
                    placeholder="All Months"
                    value={filters.claim_month ?? null}
                    onSelect={(value) => applyFilter({ claim_month: value ?? undefined })}
                />

                <CustomComboBox
                    items={availableYears.map((year) => ({ value: String(year), label: String(year) }))}
                    placeholder="All Years"
                    value={filters.claim_year ?? null}
                    onSelect={(value) => applyFilter({ claim_year: value ?? undefined })}
                />

                <CustomComboBox
                    items={claimTypes.map((type) => ({ value: String(type.id), label: type.name }))}
                    placeholder="All Types"
                    value={filters.claim_type_id ?? null}
                    onSelect={(value) => applyFilter({ claim_type_id: value ?? undefined })}
                />

                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-1 h-4 w-4" />
                        Clear
                    </Button>
                )}

                <div className="flex-1"></div>

                <Button onClick={() => setOpenCreateDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add Claim
                </Button>
            </div>

            {/* Claims Table */}
            {claimsData.data.length === 0 ? (
                <div className="text-muted-foreground rounded-sm border py-12 text-center text-sm">No claims recorded yet.</div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Salary Basis</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {claimsData.data.map((claim) => (
                                <TableRow key={claim.id}>
                                    <TableCell>{formatDate(claim.claim_date)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{claim.claim_type?.name || '—'}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">{claim.purpose}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {claim.salary ? (
                                            <span>
                                                {formatCurrency(Number(claim.salary.amount))}
                                                <span className="ml-1 text-[10px]">
                                                    (
                                                    {new Date(claim.salary.effective_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                    )
                                                </span>
                                            </span>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-600">{formatCurrency(Number(claim.amount))}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                onClick={() => openEditDialog(claim)}
                                                title="Edit Claim"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => OnclickDelete(claim)}
                                                title="Delete Claim"
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
            )}

            {/* Pagination */}
            <Pagination data={claimsData} />

            {openCreateDialog && (
                <CreateClaimDialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} employee={employee} claimTypes={claimTypes} />
            )}

            {editDialogState.open && editDialogState.claim && (
                <EditClaimDialog
                    open={editDialogState.open}
                    onClose={closeEditDialog}
                    employee={employee}
                    claim={editDialogState.claim}
                    claimTypes={claimTypes}
                />
            )}

            {openDeleteDialog && selectedClaim && (
                <DeleteClaimDialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} claim={selectedClaim} />
            )}
        </div>
    );
}
