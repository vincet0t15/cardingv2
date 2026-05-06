import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

type EmployeeData = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    position: string | null;
    office: { name: string } | null;
    funding_sources: Record<string, {
        salary: number;
        hazard_pay: number;
        clothing_allowance: number;
        pera: number;
        rata: number;
        total: number;
        code: string;
        general_fund_name: string | null;
        description: string | null;
    }>;
    total_compensation: number;
};

type Props = {
    employees: EmployeeData[];
    employeesByFund: Record<string, Array<{
        id: number;
        first_name: string;
        middle_name: string | null;
        last_name: string;
        suffix: string | null;
        position: string | null;
        office: { name: string } | null;
        total_compensation: number;
    }>>;
    sourceOfFundCodes: Array<{
        id: number;
        code: string;
        description: string | null;
        general_fund?: { id: number; name: string } | null;
    }>;
    filters: {
        year: number;
        month: number | null;
        office_id: number | null;
        source_of_fund_code_id: number | null;
        search: string | null;
    };
    summary: {
        by_fund: Record<string, { count: number; total: number; code: string; general_fund_name: string | null; description: string | null }>;
    };
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function IndexPrint({ employeesByFund, filters, summary }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const grandTotal = Object.values(summary.by_fund).reduce((sum, fund) => sum + fund.total, 0);
    const totalEmployees = Object.values(summary.by_fund).reduce((sum, fund) => sum + fund.count, 0);

    return (
        <div className="mx-auto bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title="Employees by Source of Fund" />
            <div className="mb-4 flex justify-end print:hidden">
                <Button onClick={handlePrint}>
                    <Printer className="mr-1 h-4 w-4" />
                    Print
                </Button>
            </div>

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold">EMPLOYEES BY SOURCE OF FUND</h1>
                <p className="text-sm">
                    {filters.month ? MONTHS[filters.month - 1] : 'All Months'}, {filters.year}
                </p>
            </div>

            <div className="mb-6 grid grid-cols-4 gap-4">
                {Object.entries(summary.by_fund)
                    .filter(([code]) => code !== 'Unfunded')
                    .map(([fundDisplayName, data]) => (
                        <div key={fundDisplayName} className="rounded border p-2">
                            <div className="font-semibold">{fundDisplayName}</div>
                            <div className="text-xs text-gray-600">
                                {data.code} - {data.description || '-'}
                            </div>
                            <div className="mt-1 text-sm">
                                <div>Employees: {data.count}</div>
                                <div>Total: {formatCurrency(data.total)}</div>
                            </div>
                        </div>
                    ))}
                {summary.by_fund['Unfunded'] && summary.by_fund['Unfunded'].count > 0 && (
                    <div className="rounded border p-2">
                        <div className="font-semibold">Unfunded</div>
                        <div className="mt-1 text-sm">
                            <div>Employees: {summary.by_fund['Unfunded'].count}</div>
                            <div>Total: {formatCurrency(summary.by_fund['Unfunded'].total)}</div>
                        </div>
                    </div>
                )}
            </div>

            {Object.entries(employeesByFund).map(([fundDisplayName, fundEmployees]) => (
                <div key={fundDisplayName} className="mb-6">
                    <h2 className="mb-2 bg-gray-200 p-2 font-bold">
                        {fundDisplayName} ({fundEmployees.length} employees)
                    </h2>
                    <table className="w-full border-collapse border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Employee</th>
                                <th className="border p-2 text-left">Position</th>
                                <th className="border p-2 text-left">Office</th>
                                <th className="border p-2 text-right">Total Compensation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fundEmployees.map((employee, index) => (
                                <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border p-2">
                                        {employee.last_name}, {employee.first_name} {employee.middle_name} {employee.suffix || ''}
                                    </td>
                                    <td className="border p-2">{employee.position || '-'}</td>
                                    <td className="border p-2">{employee.office?.name || '-'}</td>
                                    <td className="border p-2 text-right">{formatCurrency(employee.total_compensation)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={3} className="border p-2 text-right">Subtotal:</td>
                                <td className="border p-2 text-right">
                                    {formatCurrency(fundEmployees.reduce((sum, emp) => sum + emp.total_compensation, 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ))}

            <div className="mt-6 border-t pt-4">
                <div className="flex justify-between text-sm">
                    <div>
                        <p>Total Employees: {totalEmployees}</p>
                        <p>Total Amount: {formatCurrency(grandTotal)}</p>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                        <p>Generated: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}