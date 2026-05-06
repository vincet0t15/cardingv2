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
    salary: number;
    hazard_pay: number;
    clothing_allowance: number;
    pera: number;
    rata: number;
    total_compensation: number;
};

type FundInfo = {
    code: string;
    general_fund_name: string | null;
    description: string | null;
    count: number;
    total: number;
};

type Props = {
    fundInfo: FundInfo;
    employees: EmployeeData[];
    filters: {
        year: number;
        month: number | null;
        office_id: number | null;
        search: string | null;
    };
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function PrintFundEmployees({ fundInfo, employees, filters }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const totals = employees.reduce(
        (acc, emp) => ({
            salary: acc.salary + emp.salary,
            hazard_pay: acc.hazard_pay + emp.hazard_pay,
            clothing_allowance: acc.clothing_allowance + emp.clothing_allowance,
            pera: acc.pera + emp.pera,
            rata: acc.rata + emp.rata,
            total: acc.total + emp.total_compensation,
        }),
        { salary: 0, hazard_pay: 0, clothing_allowance: 0, pera: 0, rata: 0, total: 0 }
    );

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
                <h2 className="text-lg font-semibold">
                    {fundInfo.general_fund_name || 'Unfunded'}
                </h2>
                <p className="text-sm">
                    Code: {fundInfo.code} {fundInfo.description && `- ${fundInfo.description}`}
                </p>
                <p className="text-xs text-gray-600">
                    {filters.month ? MONTHS[filters.month - 1] : 'All Months'}, {filters.year}
                </p>
            </div>

            <table className="w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2 text-left">Employee</th>
                        <th className="border p-2 text-left">Position</th>
                        <th className="border p-2 text-left">Office</th>
                        <th className="border p-2 text-right">Salary</th>
                        <th className="border p-2 text-right">Hazard Pay</th>
                        <th className="border p-2 text-right">Clothing</th>
                        <th className="border p-2 text-right">PERA</th>
                        <th className="border p-2 text-right">RATA</th>
                        <th className="border p-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((employee, index) => (
                        <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border p-2">
                                {employee.last_name}, {employee.first_name} {employee.middle_name} {employee.suffix || ''}
                            </td>
                            <td className="border p-2">{employee.position || '-'}</td>
                            <td className="border p-2">{employee.office?.name || '-'}</td>
                            <td className="border p-2 text-right">{formatCurrency(employee.salary)}</td>
                            <td className="border p-2 text-right">{formatCurrency(employee.hazard_pay)}</td>
                            <td className="border p-2 text-right">{formatCurrency(employee.clothing_allowance)}</td>
                            <td className="border p-2 text-right">{formatCurrency(employee.pera)}</td>
                            <td className="border p-2 text-right">{formatCurrency(employee.rata)}</td>
                            <td className="border p-2 text-right font-bold">{formatCurrency(employee.total_compensation)}</td>
                        </tr>
                    ))}
                    {employees.length === 0 && (
                        <tr>
                            <td colSpan={9} className="border p-4 text-center">
                                No employees found
                            </td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-200 font-bold">
                        <td colSpan={3} className="border p-2 text-right">TOTAL:</td>
                        <td className="border p-2 text-right">{formatCurrency(totals.salary)}</td>
                        <td className="border p-2 text-right">{formatCurrency(totals.hazard_pay)}</td>
                        <td className="border p-2 text-right">{formatCurrency(totals.clothing_allowance)}</td>
                        <td className="border p-2 text-right">{formatCurrency(totals.pera)}</td>
                        <td className="border p-2 text-right">{formatCurrency(totals.rata)}</td>
                        <td className="border p-2 text-right">{formatCurrency(totals.total)}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="mt-6 text-xs text-gray-600">
                <p>Total Employees: {fundInfo.count}</p>
                <p>Total Amount: {formatCurrency(fundInfo.total)}</p>
                <p>Generated: {new Date().toLocaleString()}</p>
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