import Pagination from '@/components/paginationData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaginatedDataResponse } from '@/types/pagination';
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface EmployeeClaims {
    id: number;
    name: string;
    office: string;
    total_amount: number;
    claim_count: number;
    claim_type_counts: Record<string, number>;
}

interface Summary {
    total_employees: number;
    total_claims: number;
    total_amount: number;
}

interface Filters {
    month: string | null;
    year: number | null;
    type: string | null;
    sort_by?: string | null;
    office: string | null;
    employee: string | null;
    claim_types: string | null;
    per_page: number | null;
}

interface ClaimsReportTableProps {
    employees: PaginatedDataResponse<EmployeeClaims>;
    summary: Summary;
    filters: Filters;
    onEmployeeClick: (employeeId: number) => void;
}

export default function ClaimsReportTable({ employees, summary, filters, onEmployeeClick }: ClaimsReportTableProps) {
    const selectedClaimTypes = filters.claim_types ? filters.claim_types.split(',') : [];
    const claimTypesLabel = selectedClaimTypes.length > 0 ? selectedClaimTypes.join(', ') : 'All';

    const filteredEmployees = employees.data.filter((emp) => emp.claim_count > 0);

    const filteredSummary = {
        count: summary.total_claims,
        amount: summary.total_amount,
    };

    return (
        <>
            {/* Summary Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredEmployees.length}</div>
                        <p className="text-muted-foreground text-xs">With claims</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                        <FileText className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredSummary.count}</div>
                        <p className="text-muted-foreground text-xs">{formatCurrency(filteredSummary.amount)} total</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Claim Types</CardTitle>
                        <Receipt className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{filteredSummary.count}</div>
                        <p className="text-muted-foreground text-xs">{claimTypesLabel}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(filteredSummary.amount)}</div>
                        <p className="text-muted-foreground text-xs">Total claims amount</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Employee Claims Breakdown
                    </CardTitle>
                    <CardDescription>
                        Employees ranked by total claim amount &mdash; Filtered by: {claimTypesLabel}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredEmployees.length > 0 ? (
                        <div className="w-full overflow-hidden rounded-sm border">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">#</th>
                                        <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Employee</th>
                                        <th className="border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">Office</th>
                                        {selectedClaimTypes.map((code) => (
                                            <th key={code} className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">
                                                {code}
                                            </th>
                                        ))}
                                        <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">No. of Claims</th>
                                        <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((employee, index) => (
                                        <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="border px-3 py-2 text-center">
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="border px-3 py-2">
                                                <button
                                                    type="button"
                                                    className="hover:text-primary flex flex-col items-start text-left hover:underline"
                                                    onClick={() => onEmployeeClick(employee.id)}
                                                >
                                                    <span className="text-primary font-medium hover:underline">{employee.name}</span>
                                                </button>
                                            </td>
                                            <td className="border px-3 py-2">
                                                <p className="text-muted-foreground truncate text-sm" title={employee.office}>
                                                    {employee.office}
                                                </p>
                                            </td>
                                            {selectedClaimTypes.map((code) => (
                                                <td key={code} className="border px-3 py-2 text-right">
                                                    <span className="text-sm font-semibold">
                                                        {employee.claim_type_counts?.[code] ?? 0}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="border px-3 py-2 text-right">
                                                <span className="text-sm font-semibold">{employee.claim_count}</span>
                                            </td>
                                            <td className="border px-3 py-2 text-right">
                                                <span className="text-sm font-semibold">{formatCurrency(employee.total_amount)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-muted/50 border-t-2 font-bold">
                                        <td className="border px-3 py-2 text-right" colSpan={3}>
                                            TOTALS:
                                        </td>
                                        {selectedClaimTypes.map((code) => (
                                            <td key={code} className="border px-3 py-2 text-right">
                                                {filteredEmployees.reduce((sum, emp) => sum + (emp.claim_type_counts?.[code] ?? 0), 0)}
                                            </td>
                                        ))}
                                        <td className="border px-3 py-2 text-right">{filteredSummary.count}</td>
                                        <td className="border px-3 py-2 text-right">{formatCurrency(filteredSummary.amount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <FileText className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-muted-foreground text-sm">No claims data found for the selected filters</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination data={employees} />
                </CardContent>
            </Card>
        </>
    );
}
