import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarClock, Clock, FileText, TrendingUp, User, Wallet } from 'lucide-react';

export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
    image_path: string | null;
    office: { name: string };
    employment_status: { name: string };
    latest_salary: { amount: number } | null;
    latest_pera: { amount: number } | null;
    latest_rata: { amount: number } | null;
    latest_hazard_pay: { amount: number } | null;
    date_hired?: string | null;
}

interface EmployeeCardProps {
    employee: Employee;
    totalDeductions?: number;
    totalClaims?: number;
    totalAdjustments?: number;
    onEdit?: () => void;
    showEditButton?: boolean;
    lastUpdated?: string | null;
}

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount);
};

const getAmountValue = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'object' && 'amount' in val) return isNaN(val.amount) ? 0 : val.amount;
    return 0;
};

export function EmployeeCard({
    employee,
    totalDeductions = 0,
    totalClaims = 0,
    totalAdjustments = 0,
    onEdit,
    showEditButton = false,
    lastUpdated = null,
}: EmployeeCardProps) {
    const formatDate = (date: string | null) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <>
            {/* Profile Header */}
            <div className="flex items-center gap-6 rounded-2xl border bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-6 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20">
                <div className="relative">
                    {employee.image_path ? (
                        <img
                            src={employee.image_path}
                            alt="Profile"
                            className="h-24 w-24 rounded-full border-4 border-white object-cover dark:border-slate-800"
                        />
                    ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-green-100 dark:bg-green-900/50">
                            <User className="h-12 w-12 text-green-600" />
                        </div>
                    )}
                    {showEditButton && onEdit && (
                        <Button size="sm" className="absolute right-0 bottom-0 rounded-full" onClick={onEdit}>
                            Edit
                        </Button>
                    )}
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">
                        {employee.first_name} {employee.last_name}
                    </h1>
                    <p className="text-muted-foreground">{employee.position}</p>
                    <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {employee.office?.name}
                        </span>
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {employee.employment_status?.name}
                        </span>
                        {employee.date_hired && <span className="flex items-center gap-1">Hired: {formatDate(employee.date_hired)}</span>}
                    </div>
                    {lastUpdated && <p className="text-muted-foreground mt-2 text-xs">Last updated: {lastUpdated}</p>}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Salary</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(getAmountValue(employee.latest_salary))}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">PERA</CardTitle>
                        <CalendarClock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(getAmountValue(employee.latest_pera))}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">RATA</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(getAmountValue(employee.latest_rata))}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                        <FileText className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalClaims)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Adjustment</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalAdjustments)}</div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
