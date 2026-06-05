import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Toaster } from '@/components/ui/sonner';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Download,
    Printer,
    FileText,
    TrendingUp,
    TrendingDown,
    Wallet,
    PiggyBank,
    Percent,
    BadgePercent,
    Building2,
    User,
    Calendar,
} from 'lucide-react';
import { useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

interface PayrollData {
    earnings: {
        basic_salary: number;
        pera?: number;
        rata?: number;
        hazard_pay?: number;
        clothing_allowance?: number;
        total_claims?: number;
        adjustments?: number;
    };
    deductions: {
        sss: number;
        philhealth: number;
        pagibig: number;
        withholding_tax: number;
        items: { name: string; amount: number; type: string }[];
    };
    summary: {
        gross_pay: number;
        total_deductions: number;
        net_pay: number;
        working_days?: number;
        remarks?: string;
    };
}

interface EmployeeInfo {
    id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    position: string;
    image_path?: string;
    office: { id: number; name: string; code?: string };
    employment_status: { id: number; name: string };
}

interface PeriodOption {
    year: number;
    month: number;
}

interface PayslipPageProps {
    employee: EmployeeInfo;
    month: number;
    year: number;
    payroll: PayrollData;
    periods: PeriodOption[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₱0.00';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount);
};

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Main Component ──────────────────────────────────────────────────

export default function PayslipPage({ employee, month, year, payroll, periods }: PayslipPageProps) {
    const [selectedMonth, setSelectedMonth] = useState(String(month));
    const [selectedYear, setSelectedYear] = useState(String(year));
    const printRef = useRef<HTMLDivElement>(null);

    const handlePeriodChange = (m: string, y: string) => {
        setSelectedMonth(m);
        setSelectedYear(y);
        router.get(route('employee.payslip.show'), { month: m, year: y }, { preserveState: true, preserveScroll: true });
    };

    const handleDownloadPdf = () => {
        const url = route('employee.payslip.pdf', { month: selectedMonth, year: selectedYear });
        window.open(url, '_blank');
    };

    const { earnings, deductions, summary } = payroll;

    const earningsItems = [
        { label: 'Basic Salary', amount: earnings.basic_salary, isNegative: false },
        ...(earnings.pera ? [{ label: 'PERA', amount: earnings.pera, isNegative: false }] : []),
        ...(earnings.rata ? [{ label: 'RATA', amount: earnings.rata, isNegative: false }] : []),
        ...(earnings.hazard_pay ? [{ label: 'Hazard Pay', amount: earnings.hazard_pay, isNegative: false }] : []),
        ...(earnings.clothing_allowance ? [{ label: 'Clothing Allowance', amount: earnings.clothing_allowance, isNegative: false }] : []),
        ...(earnings.total_claims ? [{ label: 'Claims', amount: earnings.total_claims, isNegative: false }] : []),
        ...(earnings.adjustments && earnings.adjustments !== 0 ? [{ label: 'Adjustments', amount: earnings.adjustments, isNegative: earnings.adjustments < 0 }] : []),
    ];

    const deductionItems = [
        { label: 'SSS Contribution', amount: deductions.sss },
        { label: 'PhilHealth Contribution', amount: deductions.philhealth },
        { label: 'Pag-IBIG Contribution', amount: deductions.pagibig },
        { label: 'Withholding Tax', amount: deductions.withholding_tax },
        ...deductions.items.map((item) => ({ label: item.name, amount: item.amount })),
    ].filter((d) => d.amount > 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Head title={`Payslip - ${monthNames[month - 1]} ${year}`} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={route('employee.dashboard')} className="text-slate-500 hover:text-slate-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Payslip</h1>
                            <p className="text-sm text-slate-500">View and download your monthly payslip</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedMonth}
                                onValueChange={(v) => handlePeriodChange(v, selectedYear)}
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthNames.map((name, idx) => (
                                        <SelectItem key={idx + 1} value={String(idx + 1)}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={selectedYear}
                                onValueChange={(v) => handlePeriodChange(selectedMonth, v)}
                            >
                                <SelectTrigger className="w-28">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[...new Set(periods.map((p) => p.year))].sort().reverse().map((yr) => (
                                        <SelectItem key={yr} value={String(yr)}>{yr}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={handleDownloadPdf} className="gap-2">
                            <Download className="h-4 w-4" /> PDF
                        </Button>
                    </div>
                </div>

                <div ref={printRef} className="space-y-6">
                    {/* Employee Summary Card */}
                    <Card className="overflow-hidden border shadow-sm">
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                                    <FileText className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {employee.last_name}, {employee.first_name}
                                        {employee.middle_name ? ` ${employee.middle_name}` : ''}
                                        {employee.suffix ? ` ${employee.suffix}` : ''}
                                    </h2>
                                    <p className="text-sm text-slate-300">{employee.position}</p>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white">
                                            <Building2 className="h-3 w-3" /> {employee.office?.name}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white">
                                            <User className="h-3 w-3" /> {employee.employment_status?.name}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-200">
                                            <Calendar className="h-3 w-3" /> {monthNames[month - 1]} {year}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Net Pay Highlight */}
                    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                        <CardContent className="p-6 text-center">
                            <p className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700">
                                <Wallet className="h-4 w-4" /> Net Pay for {monthNames[month - 1]} {year}
                            </p>
                            <p className="mt-1 text-4xl font-bold text-emerald-800">
                                {formatCurrency(summary.net_pay)}
                            </p>
                            {summary.working_days && (
                                <p className="mt-1 text-xs text-slate-500">Working days: {summary.working_days}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Earnings & Deductions */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Earnings */}
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-slate-50/50 py-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <TrendingUp className="h-4 w-4 text-emerald-600" /> Earnings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="text-xs">
                                            <TableHead>Description</TableHead>
                                            <TableHead className="w-28 text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {earningsItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="py-8 text-center text-sm text-slate-400">
                                                    No earnings data for this period
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            earningsItems.map((item, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="text-sm">{item.label}</TableCell>
                                                    <TableCell className={`text-right text-sm font-medium ${item.amount >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                        {formatCurrency(Math.abs(item.amount))}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                        <TableRow className="border-t-2 border-slate-700 bg-slate-50">
                                            <TableCell className="text-sm font-bold text-slate-800">Gross Pay</TableCell>
                                            <TableCell className="text-right text-sm font-bold text-emerald-700">
                                                {formatCurrency(summary.gross_pay)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Deductions */}
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-slate-50/50 py-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <TrendingDown className="h-4 w-4 text-red-500" /> Deductions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="text-xs">
                                            <TableHead>Description</TableHead>
                                            <TableHead className="w-28 text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deductionItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="py-8 text-center text-sm text-slate-400">
                                                    No deductions for this period
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            deductionItems.map((item, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="text-sm">{item.label}</TableCell>
                                                    <TableCell className="text-right text-sm font-medium text-red-600">
                                                        -{formatCurrency(item.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                        <TableRow className="border-t-2 border-slate-700 bg-slate-50">
                                            <TableCell className="text-sm font-bold text-slate-800">Total Deductions</TableCell>
                                            <TableCell className="text-right text-sm font-bold text-red-600">
                                                -{formatCurrency(summary.total_deductions)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Breakdown Summary */}
                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
                        <CardHeader className="border-b border-blue-100 py-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                                <PiggyBank className="h-4 w-4" /> Summary Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg border border-emerald-200 bg-white p-4 text-center">
                                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Gross Pay</p>
                                    <p className="mt-1 text-2xl font-bold text-emerald-800">{formatCurrency(summary.gross_pay)}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">Total earnings before deductions</p>
                                </div>
                                <div className="rounded-lg border border-red-200 bg-white p-4 text-center">
                                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Deductions</p>
                                    <p className="mt-1 text-2xl font-bold text-red-700">{formatCurrency(summary.total_deductions)}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">Total contributions & withholdings</p>
                                </div>
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Net Pay</p>
                                    <p className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(summary.net_pay)}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">Take-home pay for the period</p>
                                </div>
                            </div>

                            {summary.remarks && (
                                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                                    <strong>Remarks:</strong> {summary.remarks}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">Generated on {new Date().toLocaleString('en-PH')}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()} className="gap-2">
                            <Printer className="h-4 w-4" /> Print
                        </Button>
                        <Button variant="default" onClick={handleDownloadPdf} className="gap-2 bg-emerald-700 hover:bg-emerald-800">
                            <Download className="h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
