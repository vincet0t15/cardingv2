import Pagination from '@/components/paginationData';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Clock, FileText, Receipt, TrendingUp, Users } from 'lucide-react';

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
    travel_count: number;
    travel_amount: number;
    overtime_count: number;
    overtime_amount: number;
    other_count: number;
    other_amount: number;
}

interface Summary {
    total_employees: number;
    total_claims: number;
    total_amount: number;
    total_travel_claims: number;
    total_travel_amount: number;
    total_overtime_claims: number;
    total_overtime_amount: number;
}

interface Filters {
    month: string | null;
    year: number | null;
    type: string | null;
    sort_by?: string | null;
    office: string | null;
    employee: string | null;
    per_page: number | null;
}

interface ClaimsReportTableProps {
    employees: PaginatedDataResponse<EmployeeClaims>;
    summary: Summary;
    filters: Filters;
    onEmployeeClick: (employeeId: number) => void;
}

export default function ClaimsReportTable({ employees, summary, filters, onEmployeeClick }: ClaimsReportTableProps) {
    const selectedType = filters.type || 'all';

    const filteredEmployees = employees.data.filter((emp) => {
        if (selectedType === 'travel') return emp.travel_count > 0;
        if (selectedType === 'overtime') return emp.overtime_count > 0;
        return true;
    });

    const getFilteredSummary = () => {
        if (selectedType === 'travel') {
            return {
                count: summary.total_travel_claims,
                amount: summary.total_travel_amount,
            };
        }
        if (selectedType === 'overtime') {
            return {
                count: summary.total_overtime_claims,
                amount: summary.total_overtime_amount,
            };
        }
        return {
            count: summary.total_claims,
            amount: summary.total_amount,
        };
    };

    const filteredSummary = getFilteredSummary();

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
                        <p className="text-muted-foreground text-xs">
                            With {selectedType === 'travel' ? 'travel' : selectedType === 'overtime' ? 'overtime' : ''} claims
                        </p>
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
                        <CardTitle className="text-sm font-medium">Travel Claims</CardTitle>
                        <Receipt className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{summary.total_travel_claims}</div>
                        <p className="text-muted-foreground text-xs">{formatCurrency(summary.total_travel_amount)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overtime Claims</CardTitle>
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{summary.total_overtime_claims}</div>
                        <p className="text-muted-foreground text-xs">{formatCurrency(summary.total_overtime_amount)}</p>
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
                        {selectedType === 'travel'
                            ? 'Employees with travel claims'
                            : selectedType === 'overtime'
                              ? 'Employees with overtime claims'
                              : 'Detailed breakdown of claims by employee'}
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
                                        <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">
                                            {selectedType === 'travel'
                                                ? 'Travel Trips'
                                                : selectedType === 'overtime'
                                                  ? 'Overtime Claims'
                                                  : 'Total Claims'}
                                        </th>
                                        <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">
                                            {selectedType === 'all' ? 'Total Amount' : 'Amount'}
                                        </th>
                                        {selectedType === 'all' && (
                                            <>
                                                <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">Travel</th>
                                                <th className="border px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">
                                                    Overtime
                                                </th>
                                            </>
                                        )}
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
                                            <td className="border px-3 py-2 text-right">
                                                <span className="text-sm font-semibold">
                                                    {selectedType === 'travel'
                                                        ? employee.travel_count
                                                        : selectedType === 'overtime'
                                                          ? employee.overtime_count
                                                          : employee.claim_count}
                                                </span>
                                            </td>
                                            <td className="border px-3 py-2 text-right">
                                                <span className="text-sm font-semibold">
                                                    {formatCurrency(
                                                        selectedType === 'travel'
                                                            ? employee.travel_amount
                                                            : selectedType === 'overtime'
                                                              ? employee.overtime_amount
                                                              : employee.total_amount,
                                                    )}
                                                </span>
                                            </td>
                                            {selectedType === 'all' && (
                                                <>
                                                    <td className="border px-3 py-2 text-right">
                                                        <Badge
                                                            variant="outline"
                                                            className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                                        >
                                                            {employee.travel_count} • {formatCurrency(employee.travel_amount)}
                                                        </Badge>
                                                    </td>
                                                    <td className="border px-3 py-2 text-right">
                                                        <Badge
                                                            variant="outline"
                                                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
                                                        >
                                                            {employee.overtime_count} • {formatCurrency(employee.overtime_amount)}
                                                        </Badge>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-muted/50 border-t-2 font-bold">
                                        <td className="border px-3 py-2 text-right" colSpan={3}>
                                            TOTALS:
                                        </td>
                                        <td className="border px-3 py-2 text-right">{filteredSummary.count}</td>
                                        <td className="border px-3 py-2 text-right">{formatCurrency(filteredSummary.amount)}</td>
                                        {selectedType === 'all' && (
                                            <>
                                                <td className="border px-3 py-2 text-right">
                                                    {summary.total_travel_claims} • {formatCurrency(summary.total_travel_amount)}
                                                </td>
                                                <td className="border px-3 py-2 text-right">
                                                    {summary.total_overtime_claims} • {formatCurrency(summary.total_overtime_amount)}
                                                </td>
                                            </>
                                        )}
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
