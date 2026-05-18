import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Employee } from '@/types/employee';

const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || Number.isNaN(amount)) {
        return '₱0.00';
    }

    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
};

const getInitials = (employee: Employee) => {
    const firstName = employee.first_name?.trim() || '';
    const lastName = employee.last_name?.trim() || '';

    return `${(firstName[0] || '').toUpperCase()}${(lastName[0] || '').toUpperCase()}`;
};

const getSalaryAmount = (employee: Employee): number | null => {
    if (employee.latest_salary?.amount !== undefined && employee.latest_salary?.amount !== null) {
        return Number(employee.latest_salary.amount);
    }

    if (employee.salaries?.length) {
        const sorted = [...employee.salaries].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());
        return Number(sorted[0]?.amount ?? 0);
    }

    return null;
};

interface EmployeeSummaryCardProps {
    employee: Employee;
}

export function EmployeeSummaryCard({ employee }: EmployeeSummaryCardProps) {
    const salaryAmount = getSalaryAmount(employee);

    return (
        <Card className="rounded-md border border-slate-200 bg-white shadow-sm">
            <CardContent>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-24 w-24 rounded-full border-4 border-white bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg">
                            {employee.image_path ? (
                                <AvatarImage src={employee.image_path} alt={`${employee.first_name} ${employee.last_name}`} />
                            ) : (
                                <AvatarFallback className="text-2xl font-bold">{getInitials(employee)}</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                                    {employee.last_name}, {employee.first_name}
                                </h2>
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                    {employee.employment_status?.name ?? 'Status not available'}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                <span className="font-medium">{employee.position}</span>
                                <span className="text-slate-300">•</span>
                                <span>{employee.office?.name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {salaryAmount !== null && (
                            <div className="flex items-baseline gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2">
                                <span className="text-2xl font-semibold text-slate-900">{formatCurrency(salaryAmount)}</span>
                                <span className="text-sm text-slate-500">/ month</span>
                            </div>
                        )}
                        {employee.latest_hazard_pay?.amount && (
                            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                +{formatCurrency(Number(employee.latest_hazard_pay.amount))} Hazard
                            </Badge>
                        )}
                        {employee.latest_clothing_allowance?.amount && (
                            <Badge variant="outline" className="border-pink-200 bg-pink-50 text-pink-700">
                                +{formatCurrency(Number(employee.latest_clothing_allowance.amount))} Clothing
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
