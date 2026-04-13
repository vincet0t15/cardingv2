import type { Employee } from '@/types/employee';
import { Head } from '@inertiajs/react';

interface RataPrintProps {
    employees: Employee[];
    month: string;
    year: string;
    totalRata: number;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function RataPrint({ employees, month, year, totalRata }: RataPrintProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const monthName = month ? MONTHS[parseInt(month) - 1] : 'All Months';

    return (
        <>
            <Head title="RATA Report" />
            <div className="p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold">RATA Report</h1>
                    <p className="text-gray-600">
                        {monthName} {year || 'All Years'}
                    </p>
                    <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                </div>

                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-left">#</th>
                            <th className="border p-2 text-left">Employee Name</th>
                            <th className="border p-2 text-left">Position</th>
                            <th className="border p-2 text-left">Office</th>
                            <th className="border p-2 text-right">RATA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee, index) => (
                            <tr key={employee.id}>
                                <td className="border p-2">{index + 1}</td>
                                <td className="border p-2">
                                    {employee.first_name} {employee.last_name}
                                </td>
                                <td className="border p-2">{employee.position}</td>
                                <td className="border p-2">{employee.office?.name || '-'}</td>
                                <td className="border p-2 text-right">
                                    {employee.latest_rata ? formatCurrency(Number(employee.latest_rata.amount)) : '-'}
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={5} className="border p-4 text-center text-gray-500">
                                    No records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50 font-bold">
                            <td colSpan={4} className="border p-2 text-right">
                                Total:
                            </td>
                            <td className="border p-2 text-right">{formatCurrency(totalRata)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="mt-4 text-sm text-gray-600">
                    <p>Total Employees: {employees.length}</p>
                </div>
            </div>

            <style>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    @page {
                        margin: 1cm;
                    }
                }
            `}</style>
        </>
    );
}
