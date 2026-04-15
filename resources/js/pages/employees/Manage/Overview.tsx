import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Claim } from '@/types/claim';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { Building2, CalendarDays, CoinsIcon, CreditCard, DollarSign, HardHat, Receipt, Shirt, TrendingDown, User } from 'lucide-react';

interface OverviewProps {
    employee: Employee;
    deductions: Record<string, EmployeeDeduction[]>;
    claims: Claim[];
    totalDeductionsAllTime: number;
    totalClaimsAllTime: number;
    salaryHistory?: Array<{ amount: number; effective_date: string }>;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCurrency(amount: number | undefined | null) {
    if (!amount) return '₱0.00';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(dateStr: string | undefined) {
function formatDate(dateStr?: string | undefined) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    const day = d.getDate();
    const monthShort = d.toLocaleString('en-PH', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${monthShort} ${year}`;
}

function Overview({ employee, deductions, claims, totalDeductionsAllTime, totalClaimsAllTime, salaryHistory = [] }: OverviewProps) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentPeriodKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const currentMonthDeductions = deductions[currentPeriodKey] ?? [];
    const currentMonthDeductionTotal = currentMonthDeductions.reduce((sum, d) => sum + Number(d.amount), 0);

    const currentMonthClaims = claims.filter((c) => {
        const d = new Date(c.claim_date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
    const currentMonthClaimsTotal = currentMonthClaims.reduce((sum, c) => sum + Number(c.amount), 0);

    const grossPay =
        Number(employee.latest_salary?.amount ?? 0) +
        Number(employee.latest_pera?.amount ?? 0) +
        (employee.is_rata_eligible ? Number(employee.latest_rata?.amount ?? 0) : 0) +
        Number(employee.latest_hazard_pay?.amount ?? 0) +
        Number(employee.latest_clothing_allowance?.amount ?? 0);
    const netThisMonth = grossPay - currentMonthDeductionTotal;

    // Calculate employment duration
    const hireDate = employee.salaries?.[0]?.effective_date;
    const yearsOfService = hireDate ? Math.floor((new Date().getTime() - new Date(hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

    // Recent claims (last 5)
    const recentClaims = claims.slice(0, 5);

    // Salary history (last 3 changes)

    return (
        <div className="space-y-6">
            {/* Compensation Summary */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Current Compensation</h3>
                    <Badge variant="outline" className="text-xs">
                        Gross: {formatCurrency(grossPay)}
                    </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Basic Salary</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <CoinsIcon className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(employee.latest_salary?.amount)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Effective {formatDate(employee.latest_salary?.effective_date)}</p>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">PERA</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                <CreditCard className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(employee.latest_pera?.amount)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Effective {formatDate(employee.latest_pera?.effective_date)}</p>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">RATA</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <CreditCard className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {employee.is_rata_eligible ? (
                                <>
                                    <div className="text-2xl font-bold">{formatCurrency(employee.latest_rata?.amount)}</div>
                                    <p className="text-muted-foreground mt-1 text-xs">Effective {formatDate(employee.latest_rata?.effective_date)}</p>
                                </>
                            ) : (
                                <>
                                    <div className="text-muted-foreground text-2xl font-bold">N/A</div>
                                    <p className="text-muted-foreground mt-1 text-xs">Not RATA eligible</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Hazard Pay</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                <HardHat className="h-4 w-4 text-orange-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(employee.latest_hazard_pay?.amount)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {employee.latest_hazard_pay?.start_date
                                    ? formatDate(employee.latest_hazard_pay.start_date) +
                                      (employee.latest_hazard_pay.end_date ? ` - ${formatDate(employee.latest_hazard_pay.end_date)}` : ' - Present')
                                    : 'N/A'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Clothing Allow.</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                                <Shirt className="h-4 w-4 text-pink-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(employee.latest_clothing_allowance?.amount)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {employee.latest_clothing_allowance?.start_date
                                    ? formatDate(employee.latest_clothing_allowance.start_date) +
                                      (employee.latest_clothing_allowance.end_date
                                          ? ` - ${formatDate(employee.latest_clothing_allowance.end_date)}`
                                          : ' - Present')
                                    : 'N/A'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Est. Gross Pay Card */}
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
                <Card className="border-emerald-200 bg-emerald-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800">Est. Gross Pay</CardTitle>
                        <CoinsIcon className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-700">{formatCurrency(grossPay)}</div>
                        <p className="mt-1 text-xs text-emerald-600">
                            Salary + PERA{employee.is_rata_eligible ? ' + RATA' : ''}
                            {employee.latest_hazard_pay?.amount ? ' + Hazard Pay' : ''}
                            {employee.latest_clothing_allowance?.amount ? ' + Clothing Allowance' : ''}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* This Month Activity */}
            <div>
                <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                    {MONTHS[currentMonth - 1]} {currentYear} Activity
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Deductions This Month</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(currentMonthDeductionTotal)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {currentMonthDeductions.length} deduction{currentMonthDeductions.length !== 1 ? 's' : ''} recorded
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Claims This Month</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                <Receipt className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(currentMonthClaimsTotal)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {currentMonthClaims.length} claim{currentMonthClaims.length !== 1 ? 's' : ''} recorded
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 transition-shadow hover:shadow-md dark:from-blue-900/10 dark:to-indigo-900/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">Est. Net Pay</CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-200 dark:bg-blue-900/50">
                                <CoinsIcon className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-700">{formatCurrency(netThisMonth)}</div>
                            <p className="mt-1 text-xs text-blue-600">Gross pay minus deductions</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* All-time Summary & Employment Details */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* All-time totals */}
                <Card className="transition-shadow hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                            All-Time Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Total Deductions</p>
                                    <p className="text-muted-foreground text-xs">All-time deductions</p>
                                </div>
                            </div>
                            <span className="text-xl font-bold text-red-600">{formatCurrency(totalDeductionsAllTime)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-900/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <Receipt className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Total Claims</p>
                                    <p className="text-muted-foreground text-xs">All-time claims</p>
                                </div>
                            </div>
                            <span className="text-xl font-bold text-green-600">{formatCurrency(totalClaimsAllTime)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Employment Details */}
                <Card className="transition-shadow hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-5 w-5 text-blue-600" />
                            Employment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="text-muted-foreground h-4 w-4" />
                                <span className="text-muted-foreground">Position</span>
                            </div>
                            <span className="text-sm font-semibold">{employee.position}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div className="flex items-center gap-2 text-sm">
                                <Building2 className="text-muted-foreground h-4 w-4" />
                                <span className="text-muted-foreground">Office</span>
                            </div>
                            <span className="text-sm font-semibold">{employee.office?.name ?? '—'}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div className="flex items-center gap-2 text-sm">
                                <CalendarDays className="text-muted-foreground h-4 w-4" />
                                <span className="text-muted-foreground">Status</span>
                            </div>
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                {employee.employment_status?.name ?? '—'}
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="text-muted-foreground h-4 w-4" />
                                <span className="text-muted-foreground">RATA Eligible</span>
                            </div>
                            <Badge variant={employee.is_rata_eligible ? 'default' : 'secondary'}>{employee.is_rata_eligible ? 'Yes' : 'No'}</Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div className="flex items-center gap-2 text-sm">
                                <CoinsIcon className="text-muted-foreground h-4 w-4" />
                                <span className="text-muted-foreground">Source of Fund</span>
                            </div>
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                {employee.latest_salary?.source_of_fund_code?.code ?? 'Not Assigned'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Deductions */}
            {Object.keys(deductions).length > 0 && (
                <div>
                    <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Latest Deductions Period</h3>
                    <Card>
                        <CardContent className="pt-4">
                            {(() => {
                                const latestKey = Object.keys(deductions)[0];
                                const [year, month] = latestKey.split('-');
                                const items = deductions[latestKey];
                                const total = items.reduce((sum, d) => sum + Number(d.amount), 0);
                                return (
                                    <div className="space-y-2">
                                        <p className="mb-3 text-sm font-semibold">
                                            {MONTHS[parseInt(month) - 1]} {year}
                                        </p>
                                        {items.map((d) => (
                                            <div key={d.id} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{d.deduction_type?.name ?? '—'}</span>
                                                <span className="font-medium text-red-600">{formatCurrency(Number(d.amount))}</span>
                                            </div>
                                        ))}
                                        <Separator className="my-2" />
                                        <div className="flex items-center justify-between text-sm font-semibold">
                                            <span>Total</span>
                                            <span className="text-red-600">{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Deduction Breakdown with Percentages */}
            {currentMonthDeductions.length > 0 && (
                <div>
                    <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Current Month Deduction Breakdown</h3>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                {currentMonthDeductions.map((deduction) => {
                                    const amount = Number(deduction.amount);
                                    const percentage = grossPay > 0 ? (amount / grossPay) * 100 : 0;
                                    return (
                                        <div key={deduction.id} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{deduction.deduction_type?.name ?? '—'}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground text-xs">{percentage.toFixed(1)}%</span>
                                                    <span className="font-semibold text-red-600">{formatCurrency(amount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                                <div
                                                    className="h-full bg-red-500 transition-all"
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                <Separator className="my-2" />
                                <div className="flex items-center justify-between text-sm font-semibold">
                                    <span>Total Deductions</span>
                                    <span className="text-red-600">{formatCurrency(currentMonthDeductionTotal)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recent Claims Activity */}
            {recentClaims.length > 0 && (
                <div>
                    <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Recent Claims Activity</h3>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                {recentClaims.map((claim) => (
                                    <div
                                        key={claim.id}
                                        className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-700"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Receipt className="text-muted-foreground h-4 w-4" />
                                                <span className="text-sm font-medium">{claim.claim_type?.name ?? 'Claim'}</span>
                                            </div>
                                            <p className="text-muted-foreground mt-1 text-xs">{claim.purpose}</p>
                                            <p className="text-muted-foreground mt-1 text-xs">{formatDate(claim.claim_date)}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-green-600">{formatCurrency(claim.amount)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Compensation History Trend */}
            {employee.salaries && employee.salaries.length > 1 && (
                <div>
                    <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Compensation History</h3>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                {employee.salaries.slice(0, 5).map((salary, index) => {
                                    const prevSalary = employee.salaries?.[index + 1];
                                    const increase = prevSalary ? Number(salary.amount) - Number(prevSalary.amount) : 0;
                                    const increasePercent =
                                        prevSalary && Number(prevSalary.amount) > 0 ? (increase / Number(prevSalary.amount)) * 100 : 0;

                                    return (
                                        <div key={salary.id} className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium">{formatCurrency(salary.amount)}</div>
                                                <div className="text-muted-foreground text-xs">Effective {formatDate(salary.effective_date)}</div>
                                            </div>
                                            {increase > 0 && (
                                                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                    +{formatCurrency(increase)} ({increasePercent.toFixed(1)}%)
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default Overview;
