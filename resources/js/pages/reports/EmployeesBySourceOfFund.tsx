import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import Pagination from '@/components/paginationData';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { PaginatedDataResponse } from '@/types/pagination';
import { SourceOfFundCode } from '@/types/sourceOfFundCOde';
import { Head, router, useForm } from '@inertiajs/react';
import { User } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports/employees-by-source-of-fund',
    },
    {
        title: 'Employee List by Source of Fund',
        href: '/reports/employees-by-source-of-fund',
    },
];

interface Props {
    sourceOfFundCodes: SourceOfFundCode[];
    employees: PaginatedDataResponse<{
        id: number;
        first_name: string;
        middle_name: string | null;
        last_name: string;
        suffix: string | null;
        position: string | null;
        office: { name: string } | null;
        employment_status: { name: string } | null;
        salary_amount: number | null;
        salary_effective_date: string | null;
    }>;
    filters?: {
        source_of_fund_code_id?: string;
        month?: string;
        year?: string;
    };
    availableYears?: number[];
}

export default function EmployeesBySourceOfFund({ sourceOfFundCodes, employees, filters = {}, availableYears = [] }: Props) {
    const { data, setData } = useForm({
        source_of_fund_code_id: filters.source_of_fund_code_id || '',
        month: filters.month || '',
        year: filters.year || new Date().getFullYear().toString(),
        search: '',
    });

    const [loading, setLoading] = useState(false);

    const applyFilters = (overrides?: Partial<typeof data>) => {
        const merged = { ...data, ...overrides };
        const queryString: Record<string, string> = {};
        if (merged.source_of_fund_code_id) queryString.source_of_fund_code_id = merged.source_of_fund_code_id;
        if (merged.month) queryString.month = merged.month;
        if (merged.year) queryString.year = merged.year;
        if (merged.search) queryString.search = merged.search;
        router.get(route('reports.employees-by-source-of-fund'), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFilters();
        }
    };

    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    // Use available years from backend, or generate default range (fixed start year 2020 to current year + 5)
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 5;
    const defaultYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    const years = availableYears.length > 0 ? availableYears : defaultYears;

    const handlePrint = () => {
        if (!data.source_of_fund_code_id) {
            alert('Please select a source of fund code');
            return;
        }

        const params: Record<string, string> = {};
        params.source_of_fund_code_id = data.source_of_fund_code_id;
        if (data.month) params.month = data.month;
        if (data.year) params.year = data.year;

        const queryString = new URLSearchParams(params).toString();
        window.open(`/reports/employees-by-source-of-fund/print?${queryString}`, '_blank');
    };
    const handleSourceOfFundChange = (value: string) => {
        const newSourceId = value === '' ? '' : value;
        setData('source_of_fund_code_id', newSourceId);
        applyFilters({ source_of_fund_code_id: newSourceId });
    };

    const handleMonthChange = (value: string) => {
        const newMonth = value === '' ? '' : value;
        setData('month', newMonth);
        applyFilters({ month: newMonth });
    };

    const handleYearChange = (value: string) => {
        const newYear = value === '' ? '' : value;
        setData('year', newYear);
        applyFilters({ year: newYear });
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '—';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee List by Source of Fund" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Heading title="Employee List by Source of Fund" description="Filter and print employees by their salary source of fund code" />
                <div className="text-left text-sm">
                    <p className="font-semibold">Instructions:</p>
                    <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1">
                        <li>Select a source of fund code from the dropdown</li>
                        <li>Optionally select a specific month (leave empty for all months)</li>
                        <li>Select the year</li>
                        <li>Click "Generate Report" to preview or "Print Report" to print directly</li>
                    </ul>
                </div>
                <div className="bg-card rounded-lg border p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Source of Fund */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source of Fund Code</label>
                            <CustomComboBox
                                items={sourceOfFundCodes.map((fund) => ({
                                    value: fund.id.toString(),
                                    label: `${fund.code} - ${fund.description || ''}`,
                                }))}
                                placeholder="Select source of fund"
                                value={data.source_of_fund_code_id || null}
                                onSelect={(value) => handleSourceOfFundChange(value ?? '')}
                                showClear={true}
                            />
                        </div>

                        {/* Month */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Month (Optional)</label>
                            <CustomComboBox
                                items={months}
                                placeholder="All Months"
                                value={data.month || null}
                                onSelect={(value) => handleMonthChange(value ?? '')}
                                showClear={true}
                            />
                        </div>

                        {/* Year */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Year</label>
                            <CustomComboBox
                                items={years.map((year) => ({
                                    value: year.toString(),
                                    label: year.toString(),
                                }))}
                                placeholder="Select year"
                                value={data.year || null}
                                onSelect={(value) => handleYearChange(value ?? '')}
                                showClear={false}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Button type="button" onClick={handlePrint} disabled={!data.source_of_fund_code_id}>
                            Print Report
                        </Button>
                    </div>
                </div>
                {/* Employee List Display */}
                {employees.data.length > 0 ? (
                    <div className="space-y-4">
                        {/* Summary Header */}
                        <div className="bg-card rounded-lg border p-4 shadow-sm">
                            <h3 className="text-lg font-semibold">Filtered Employees ({employees.total})</h3>
                            <p className="text-muted-foreground text-sm">
                                Source of Fund: {sourceOfFundCodes.find((f) => f.id.toString() === data.source_of_fund_code_id)?.code}
                                {data.month && ` • ${months.find((m) => m.value === data.month)?.label}`}
                                {data.year && ` • ${data.year}`}
                            </p>
                        </div>

                        {/* Table */}
                        <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="text-primary w-[60px] font-bold">#</TableHead>
                                        <TableHead className="text-primary font-bold">Employee</TableHead>
                                        <TableHead className="text-primary font-bold">Position</TableHead>
                                        <TableHead className="text-primary font-bold">Office</TableHead>
                                        <TableHead className="text-primary font-bold">Status</TableHead>
                                        <TableHead className="text-primary text-right font-bold">Monthly Salary</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {employees.data.map((employee, index) => (
                                        <TableRow key={employee.id} className="hover:bg-muted/30">
                                            <TableCell className="text-sm">{employees.from + index}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-10 w-10 border-2 border-slate-200 shadow-sm dark:border-slate-700">
                                                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                                                            <User className="h-5 w-5 text-slate-400" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold uppercase">
                                                            {employee.last_name}, {employee.first_name} {employee.middle_name} {employee.suffix}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{employee.position || '—'}</TableCell>
                                            <TableCell className="text-sm">{employee.office?.name || '—'}</TableCell>
                                            <TableCell className="text-sm">{employee.employment_status?.name || '—'}</TableCell>
                                            <TableCell className="text-right text-sm font-medium">{formatCurrency(employee.salary_amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card rounded-lg border p-12 text-center shadow-sm">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <User className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-muted-foreground">Please select a source of fund code to view employees</p>
                    </div>
                )}

                {/* Pagination */}
                {employees.data.length > 0 && (
                    <div>
                        <Pagination data={employees} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
