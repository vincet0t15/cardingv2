import { CustomComboBox } from '@/components/CustomComboBox';
import Heading from '@/components/heading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import type { Pera } from '@/types/pera';
import type { Rata } from '@/types/rata';
import type { Salary } from '@/types/salary';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Printer, User } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: '/payroll',
    },
    {
        title: 'Details',
        href: '#',
    },
];

const MONTHS = [
    { value: 0, label: 'All' },
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

interface PayrollShowProps {
    employee: Employee;
    salaryHistory: Salary[];
    peraHistory: Pera[];
    rataHistory: Rata[];
    deductions: EmployeeDeduction[];
    filters: {
        month: number;
        year: number;
    };
}

export default function PayrollShow({ employee, salaryHistory, peraHistory, rataHistory, deductions, filters }: PayrollShowProps) {
    const { data: filterData, setData: setFilterData } = useForm({
        month: filters.month,
        year: filters.year,
    });

    const handleFilterChange = () => {
        router.get(
            route('payroll.show', employee.id),
            {
                month: filterData.month,
                year: filterData.year,
            },
            {
                preserveState: true,
            },
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getMonthName = (month: number) => {
        return MONTHS.find((m) => m.value === month)?.label || 'All';
    };

    const currentSalary = Number(salaryHistory[0]?.amount) || 0;
    const currentPera = Number(peraHistory[0]?.amount) || 0;
    const currentRata = Number(rataHistory[0]?.amount) || 0;
    const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);
    const grossPay = currentSalary + currentPera + currentRata;
    const netPay = grossPay - totalDeductions;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll - ${employee.last_name}, ${employee.first_name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.get(route('payroll.index'))}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-slate-200 shadow-sm dark:border-slate-700">
                            {employee.image_path ? (
                                <AvatarImage
                                    src={employee.image_path ?? undefined}
                                    alt={`${employee.first_name} ${employee.last_name}`}
                                    className="object-cover"
                                />
                            ) : null}
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                                <User className="h-8 w-8 text-slate-400" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {employee.last_name}, {employee.first_name} {employee.middle_name}
                            </h1>
                            <p className="text-muted-foreground">{employee.position}</p>
                            <p className="text-muted-foreground text-sm">{employee.office?.name}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-[140px]">
                        <CustomComboBox
                            items={MONTHS.map((month) => ({ value: month.value.toString(), label: month.label }))}
                            placeholder="Month"
                            value={filterData.month.toString()}
                            onSelect={(value) => setFilterData('month', value ? parseInt(value) : 0)}
                        />
                    </div>

                    <Input
                        type="number"
                        className="w-[100px]"
                        value={filterData.year}
                        onChange={(e) => setFilterData('year', parseInt(e.target.value))}
                    />

                    <Button onClick={handleFilterChange}>View</Button>

                    <Button
                        variant="outline"
                        onClick={() => {
                            const query = new URLSearchParams();
                            // Only add month if not "All" (0)
                            if (filterData.month !== 0) {
                                query.append('month', filterData.month.toString());
                            }
                            query.append('year', filterData.year.toString());
                            query.append('employee_id', employee.id.toString());
                            window.open(route('payroll.print') + '?' + query.toString(), '_blank');
                        }}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-card rounded-lg border p-4">
                        <p className="text-muted-foreground text-sm">Salary</p>
                        <p className="text-2xl font-bold">{formatCurrency(currentSalary)}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-4">
                        <p className="text-muted-foreground text-sm">PERA</p>
                        <p className="text-2xl font-bold">{formatCurrency(currentPera)}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-4">
                        <p className="text-muted-foreground text-sm">RATA</p>
                        <p className="text-2xl font-bold">{employee.is_rata_eligible ? formatCurrency(currentRata) : '-'}</p>
                    </div>
                    <div className="bg-card rounded-lg border p-4">
                        <p className="text-muted-foreground text-sm">Gross Pay</p>
                        <p className="text-2xl font-bold">{formatCurrency(grossPay)}</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-card rounded-lg border p-4">
                        <p className="text-muted-foreground text-sm">Total Deductions</p>
                        <p className="text-destructive text-2xl font-bold">{formatCurrency(totalDeductions)}</p>
                    </div>
                    <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950">
                        <p className="text-muted-foreground text-sm">Net Pay</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(netPay)}</p>
                    </div>
                </div>

                <Heading title="Deductions" description={`Deductions for ${getMonthName(filters.month)} ${filters.year}`} />

                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Deduction Type</TableHead>
                                <TableHead className="text-primary text-right font-bold">Amount</TableHead>
                                <TableHead className="text-primary font-bold">Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {deductions.length > 0 ? (
                                deductions.map((deduction) => (
                                    <TableRow key={deduction.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{deduction.deduction_type?.name}</TableCell>
                                        <TableCell className="text-destructive text-right">{formatCurrency(deduction.amount)}</TableCell>
                                        <TableCell className="text-muted-foreground">{deduction.notes || '-'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-3 text-center text-gray-500">
                                        No deductions for this period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Heading title="Salary History" description="Recent salary changes" />

                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Amount</TableHead>
                                <TableHead className="text-primary font-bold">Effective Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {salaryHistory.length > 0 ? (
                                salaryHistory.slice(0, 5).map((salary) => (
                                    <TableRow key={salary.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{formatCurrency(salary.amount)}</TableCell>
                                        <TableCell>{formatDate(salary.effective_date)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="py-3 text-center text-gray-500">
                                        No salary history.
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
