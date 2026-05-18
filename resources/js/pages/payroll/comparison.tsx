import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { EmploymentStatus } from '@/types/employmentStatuses';
import type { Office } from '@/types/office';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowLeft, ArrowUp, Minus, Search } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: '/payroll',
    },
    {
        title: 'Comparison Report',
        href: '/payroll/comparison',
    },
];

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

interface PeriodData {
    month: number;
    year: number;
    salary: number;
    pera: number;
    rata: number;
    gross_pay: number;
    deductions: number;
    net_pay: number;
}

interface Differences {
    salary: number;
    pera: number;
    rata: number;
    gross_pay: number;
    deductions: number;
    net_pay: number;
}

interface EmployeeComparison {
    id: number;
    name: string;
    position: string;
    office: string;
    employment_status: string;
    is_rata_eligible: boolean;
    period1: PeriodData;
    period2: PeriodData;
    differences: Differences;
}

interface ComparisonProps {
    employees: EmployeeComparison[];
    offices: Office[];
    employmentStatuses: EmploymentStatus[];
    filters: {
        period1_month: number;
        period1_year: number;
        period2_month: number;
        period2_year: number;
        office_id?: number;
        employment_status_id?: number;
        search?: string;
    };
}

export default function Comparison({ employees, offices, employmentStatuses, filters }: ComparisonProps) {
    const { data: filterData, setData: setFilterData } = useForm({
        period1_month: filters.period1_month,
        period1_year: filters.period1_year,
        period2_month: filters.period2_month,
        period2_year: filters.period2_year,
        office_id: filters.office_id?.toString() || '',
        employment_status_id: filters.employment_status_id?.toString() || '',
        search: filters.search || '',
    });

    const officeOptions = offices.map((office) => ({
        value: office.id.toString(),
        label: office.name,
    }));

    const employmentStatusOptions = employmentStatuses.map((s) => ({
        value: s.id.toString(),
        label: s.name,
    }));

    const monthOptions = MONTHS.map((m) => ({ value: m.value.toString(), label: m.label }));

    const handleFilterChange = () => {
        const queryString: Record<string, string | number> = {};
        if (filterData.period1_month) queryString.period1_month = filterData.period1_month;
        if (filterData.period1_year) queryString.period1_year = filterData.period1_year;
        if (filterData.period2_month) queryString.period2_month = filterData.period2_month;
        if (filterData.period2_year) queryString.period2_year = filterData.period2_year;
        if (filterData.office_id) queryString.office_id = filterData.office_id;
        if (filterData.employment_status_id) queryString.employment_status_id = filterData.employment_status_id;
        if (filterData.search) queryString.search = filterData.search;

        router.get(route('payroll.comparison'), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const getMonthName = (month: number) => {
        return MONTHS.find((m) => m.value === month)?.label || '';
    };

    const formatDifference = (value: number) => {
        const formatted = formatCurrency(Math.abs(value));
        if (value > 0) {
            return { text: `+${formatted}`, icon: <ArrowUp className="h-4 w-4" />, color: 'text-green-600' };
        } else if (value < 0) {
            return { text: `-${formatted}`, icon: <ArrowDown className="h-4 w-4" />, color: 'text-red-600' };
        }
        return { text: formatted, icon: <Minus className="h-4 w-4" />, color: 'text-gray-500' };
    };

    // Calculate totals
    const period1Totals = employees.reduce(
        (acc, emp) => ({
            salary: acc.salary + emp.period1.salary,
            pera: acc.pera + emp.period1.pera,
            rata: acc.rata + emp.period1.rata,
            gross_pay: acc.gross_pay + emp.period1.gross_pay,
            deductions: acc.deductions + emp.period1.deductions,
            net_pay: acc.net_pay + emp.period1.net_pay,
        }),
        { salary: 0, pera: 0, rata: 0, gross_pay: 0, deductions: 0, net_pay: 0 },
    );

    const period2Totals = employees.reduce(
        (acc, emp) => ({
            salary: acc.salary + emp.period2.salary,
            pera: acc.pera + emp.period2.pera,
            rata: acc.rata + emp.period2.rata,
            gross_pay: acc.gross_pay + emp.period2.gross_pay,
            deductions: acc.deductions + emp.period2.deductions,
            net_pay: acc.net_pay + emp.period2.net_pay,
        }),
        { salary: 0, pera: 0, rata: 0, gross_pay: 0, deductions: 0, net_pay: 0 },
    );

    const totalDifferences = employees.reduce(
        (acc, emp) => ({
            salary: acc.salary + emp.differences.salary,
            pera: acc.pera + emp.differences.pera,
            rata: acc.rata + emp.differences.rata,
            gross_pay: acc.gross_pay + emp.differences.gross_pay,
            deductions: acc.deductions + emp.differences.deductions,
            net_pay: acc.net_pay + emp.differences.net_pay,
        }),
        { salary: 0, pera: 0, rata: 0, gross_pay: 0, deductions: 0, net_pay: 0 },
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comparison Report" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Payroll Comparison Report"
                        description={`Comparing ${getMonthName(filters.period1_month)} ${filters.period1_year} vs ${getMonthName(filters.period2_month)} ${filters.period2_year}`}
                    />
                    <Button variant="outline" onClick={() => router.get(route('payroll.index'))}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Payroll
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                {getMonthName(filters.period1_month)} {filters.period1_year}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <div className="text-lg font-bold">{formatCurrency(period1Totals.net_pay)}</div>
                                <div className="text-muted-foreground text-xs">Total Net Pay</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                {getMonthName(filters.period2_month)} {filters.period2_year}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <div className="text-lg font-bold">{formatCurrency(period2Totals.net_pay)}</div>
                                <div className="text-muted-foreground text-xs">Total Net Pay</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Difference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <div className={`flex items-center gap-1 text-lg font-bold ${formatDifference(totalDifferences.net_pay).color}`}>
                                    {formatDifference(totalDifferences.net_pay).icon}
                                    {formatDifference(totalDifferences.net_pay).text}
                                </div>
                                <div className="text-muted-foreground text-xs">Net Pay Change</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex w-full flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">Period 1:</span>
                        <div className="w-[160px]">
                            <CustomComboBox
                                items={monthOptions}
                                placeholder="Select Month"
                                value={filterData.period1_month.toString()}
                                onSelect={(value) => setFilterData('period1_month', value ? parseInt(value) : 0)}
                            />
                        </div>
                        <Input
                            type="number"
                            className="w-[100px]"
                            value={filterData.period1_year}
                            onChange={(e) => setFilterData('period1_year', parseInt(e.target.value))}
                            placeholder="Year"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">Period 2:</span>
                        <div className="w-[160px]">
                            <CustomComboBox
                                items={monthOptions}
                                placeholder="Select Month"
                                value={filterData.period2_month.toString()}
                                onSelect={(value) => setFilterData('period2_month', value ? parseInt(value) : 0)}
                            />
                        </div>
                        <Input
                            type="number"
                            className="w-[100px]"
                            value={filterData.period2_year}
                            onChange={(e) => setFilterData('period2_year', parseInt(e.target.value))}
                            placeholder="Year"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Office */}
                        <div className="w-[220px]">
                            <CustomComboBox
                                items={officeOptions}
                                placeholder="All Offices"
                                value={filterData.office_id || null}
                                onSelect={(value) => setFilterData('office_id', value ?? '')}
                            />
                        </div>

                        {/* Employment Status */}
                        <div className="w-[200px]">
                            <CustomComboBox
                                items={employmentStatusOptions}
                                placeholder="All Status"
                                value={filterData.employment_status_id || null}
                                onSelect={(value) => setFilterData('employment_status_id', value ?? '')}
                            />
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-[200px]">
                            <Input
                                placeholder="Search employee..."
                                className="pl-8"
                                value={filterData.search}
                                onChange={(e) => setFilterData('search', e.target.value)}
                            />
                            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
                        </div>

                        <Button onClick={handleFilterChange}>Compare</Button>
                    </div>
                </div>

                {/* Comparison Table */}
                <div className="w-full overflow-x-auto rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold" rowSpan={2}>
                                    Employee
                                </TableHead>
                                <TableHead className="text-primary text-center font-bold" colSpan={6}>
                                    {getMonthName(filters.period1_month)} {filters.period1_year}
                                </TableHead>
                                <TableHead className="text-primary text-center font-bold" colSpan={6}>
                                    {getMonthName(filters.period2_month)} {filters.period2_year}
                                </TableHead>
                                <TableHead className="text-primary text-center font-bold text-green-600" colSpan={6}>
                                    Difference
                                </TableHead>
                            </TableRow>
                            <TableRow>
                                {/* Period 1 */}
                                <TableHead className="text-primary text-right text-xs font-bold">Salary</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">PERA</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">RATA</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">Gross</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">Ded</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">Net</TableHead>
                                {/* Period 2 */}
                                <TableHead className="text-primary text-right text-xs font-bold">Salary</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">PERA</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">RATA</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">Gross</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">Ded</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">Net</TableHead>
                                {/* Differences */}
                                <TableHead className="text-primary text-right text-xs font-bold">Salary</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">PERA</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">RATA</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">Gross</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">Ded</TableHead>
                                <TableHead className="text-primary text-right text-xs font-bold">Net</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {employees.length > 0 ? (
                                <>
                                    {employees.map((employee) => (
                                        <TableRow key={employee.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{employee.name}</span>
                                                    <span className="text-muted-foreground text-xs">{employee.position}</span>
                                                </div>
                                            </TableCell>
                                            {/* Period 1 */}
                                            <TableCell className="text-right text-xs">{formatCurrency(employee.period1.salary)}</TableCell>
                                            <TableCell className="text-right text-xs">{formatCurrency(employee.period1.pera)}</TableCell>
                                            <TableCell className="text-right text-xs">
                                                {employee.is_rata_eligible ? formatCurrency(employee.period1.rata) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-medium">
                                                {formatCurrency(employee.period1.gross_pay)}
                                            </TableCell>
                                            <TableCell className="text-destructive text-right text-xs">
                                                {formatCurrency(employee.period1.deductions)}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold">{formatCurrency(employee.period1.net_pay)}</TableCell>
                                            {/* Period 2 */}
                                            <TableCell className="text-right text-xs">{formatCurrency(employee.period2.salary)}</TableCell>
                                            <TableCell className="text-right text-xs">{formatCurrency(employee.period2.pera)}</TableCell>
                                            <TableCell className="text-right text-xs">
                                                {employee.is_rata_eligible ? formatCurrency(employee.period2.rata) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-medium">
                                                {formatCurrency(employee.period2.gross_pay)}
                                            </TableCell>
                                            <TableCell className="text-destructive text-right text-xs">
                                                {formatCurrency(employee.period2.deductions)}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold">{formatCurrency(employee.period2.net_pay)}</TableCell>
                                            {/* Differences */}
                                            <TableCell className={`text-right text-xs ${formatDifference(employee.differences.salary).color}`}>
                                                {formatDifference(employee.differences.salary).text}
                                            </TableCell>
                                            <TableCell className={`text-right text-xs ${formatDifference(employee.differences.pera).color}`}>
                                                {formatDifference(employee.differences.pera).text}
                                            </TableCell>
                                            <TableCell className={`text-right text-xs ${formatDifference(employee.differences.rata).color}`}>
                                                {employee.is_rata_eligible ? formatDifference(employee.differences.rata).text : '-'}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right text-xs font-medium ${formatDifference(employee.differences.gross_pay).color}`}
                                            >
                                                {formatDifference(employee.differences.gross_pay).text}
                                            </TableCell>
                                            <TableCell className={`text-right text-xs ${formatDifference(employee.differences.deductions).color}`}>
                                                {formatDifference(employee.differences.deductions).text}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right text-xs font-bold ${formatDifference(employee.differences.net_pay).color}`}
                                            >
                                                {formatDifference(employee.differences.net_pay).text}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals Row */}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell>TOTALS</TableCell>
                                        {/* Period 1 Totals */}
                                        <TableCell className="text-right text-xs">{formatCurrency(period1Totals.salary)}</TableCell>
                                        <TableCell className="text-right text-xs">{formatCurrency(period1Totals.pera)}</TableCell>
                                        <TableCell className="text-right text-xs">{formatCurrency(period1Totals.rata)}</TableCell>
                                        <TableCell className="text-right text-xs">{formatCurrency(period1Totals.gross_pay)}</TableCell>
                                        <TableCell className="text-destructive text-right text-xs">
                                            {formatCurrency(period1Totals.deductions)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs">{formatCurrency(period1Totals.net_pay)}</TableCell>
                                        {/* Period 2 Totals */}
                                        <TableCell className="text-right text-xs">{formatCurrency(period2Totals.salary)}</TableCell>
                                        <TableCell className="text-right text-xs">{formatCurrency(period2Totals.pera)}</TableCell>
                                        <TableCell className="text-right text-xs">{formatCurrency(period2Totals.rata)}</TableCell>
                                        <TableCell className="text-right text-xs">{formatCurrency(period2Totals.gross_pay)}</TableCell>
                                        <TableCell className="text-destructive text-right text-xs">
                                            {formatCurrency(period2Totals.deductions)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs">{formatCurrency(period2Totals.net_pay)}</TableCell>
                                        {/* Difference Totals */}
                                        <TableCell className={`text-right text-xs ${formatDifference(totalDifferences.salary).color}`}>
                                            {formatDifference(totalDifferences.salary).text}
                                        </TableCell>
                                        <TableCell className={`text-right text-xs ${formatDifference(totalDifferences.pera).color}`}>
                                            {formatDifference(totalDifferences.pera).text}
                                        </TableCell>
                                        <TableCell className={`text-right text-xs ${formatDifference(totalDifferences.rata).color}`}>
                                            {formatDifference(totalDifferences.rata).text}
                                        </TableCell>
                                        <TableCell className={`text-right text-xs ${formatDifference(totalDifferences.gross_pay).color}`}>
                                            {formatDifference(totalDifferences.gross_pay).text}
                                        </TableCell>
                                        <TableCell className={`text-right text-xs ${formatDifference(totalDifferences.deductions).color}`}>
                                            {formatDifference(totalDifferences.deductions).text}
                                        </TableCell>
                                        <TableCell className={`text-right text-xs ${formatDifference(totalDifferences.net_pay).color}`}>
                                            {formatDifference(totalDifferences.net_pay).text}
                                        </TableCell>
                                    </TableRow>
                                </>
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={19} className="py-3 text-center text-gray-500">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
