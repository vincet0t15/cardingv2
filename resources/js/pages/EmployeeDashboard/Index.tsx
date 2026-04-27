import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Employee } from '@/types/employee';
import { type EmploymentStatus } from '@/types/employmentStatuses';
import { type Office } from '@/types/office';
import { Head } from '@inertiajs/react';
import { CalendarClock, Coins, FileText, TrendingUp, User, Wallet } from 'lucide-react';

interface EmployeeDashboardProps {
    employee: Employee & {
        office: Office;
        employmentStatus: EmploymentStatus;
        latestSalary: { amount: number } | null;
        latestPera: { amount: number } | null;
        latestRata: { amount: number } | null;
        latestHazardPay: { amount: number } | null;
        latestClothingAllowance: { amount: number } | null;
    };
    groupedDeductions: Record<string, any[]>;
    totalDeductions: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Dashboard',
        href: '/employee/dashboard',
    },
];

export default function Index({ employee, groupedDeductions, totalDeductions }: EmployeeDashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-6 dark:border-green-800 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                            <User className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Welcome, {employee.first_name} {employee.last_name}
                            </h1>
                            <p className="text-muted-foreground">
                                {employee.position} - {employee.office?.name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Compensation Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">Salary</p>
                                <p className="text-lg font-semibold">
                                    {employee.latestSalary ? formatCurrency(employee.latestSalary.amount) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                                <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">PERA</p>
                                <p className="text-lg font-semibold">{employee.latestPera ? formatCurrency(employee.latestPera.amount) : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">RATA</p>
                                <p className="text-lg font-semibold">{employee.latestRata ? formatCurrency(employee.latestRata.amount) : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                                <CalendarClock className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">Hazard Pay</p>
                                <p className="text-lg font-semibold">
                                    {employee.latestHazardPay ? formatCurrency(employee.latestHazardPay.amount) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-800">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <FileText className="h-5 w-5" />
                            My Deductions
                        </h2>
                        <div className="text-right">
                            <p className="text-muted-foreground text-sm">Total Deductions</p>
                            <p className="text-lg font-semibold text-red-600">{formatCurrency(totalDeductions)}</p>
                        </div>
                    </div>

                    {Object.keys(groupedDeductions).length === 0 ? (
                        <div className="text-muted-foreground py-8 text-center">No deductions found</div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedDeductions)
                                .slice(0, 6)
                                .map(([period, deductions]: [string, any]) => (
                                    <div key={period} className="rounded-lg border p-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="font-medium">{period}</span>
                                            <span className="text-muted-foreground text-sm">
                                                {formatCurrency(deductions.reduce((sum: number, d: any) => sum + (d.amount || 0), 0))}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {deductions.map((d: any) => (
                                                <div key={d.id} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{d.deduction_type?.name}</span>
                                                    <span className="font-medium">{formatCurrency(d.amount || 0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
