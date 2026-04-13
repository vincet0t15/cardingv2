import { Button } from '@/components/ui/button';
import type { Employee } from '@/types/employee';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface ClothingAllowancePrintProps {
    employees: Employee[];
    month: string;
    year: string;
    totalClothingAllowance: number;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ClothingAllowancePrint({ employees, month, year, totalClothingAllowance }: ClothingAllowancePrintProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const monthName = month ? MONTHS[parseInt(month) - 1] : 'All Months';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="mx-auto bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title="Clothing Allowance Report" />
            <div className="mb-4 flex justify-end print:hidden">
                <Button onClick={handlePrint}>
                    <Printer />
                    Print Report
                </Button>
            </div>

            <div className="print-wrapper mx-auto w-[12in]">
                <table className="w-full border-0">
                    <tbody>
                        <tr>
                            <td>
                                <div className="mb-3 text-center">
                                    <h2
                                        className="m-0 text-[14px] font-bold uppercase"
                                        style={{
                                            fontFamily: '"Old English Text MT", "Times New Roman", serif',
                                        }}
                                    >
                                        CLOTHING ALLOWANCE REPORT
                                    </h2>
                                    <p className="m-[2px_0] text-[11px]">
                                        {monthName} {year || 'All Years'}
                                    </p>
                                    <p className="m-0 text-[9px] text-gray-500">
                                        Generated:{' '}
                                        {new Date().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <table className="mb-4 w-full border-collapse border border-black text-[10px]">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-1 font-bold">Total Clothing Allowance</td>
                                            <td className="border border-black p-1 text-right">{formatCurrency(totalClothingAllowance)}</td>
                                            <td className="border border-black p-1 font-bold">Total Employees</td>
                                            <td className="border border-black p-1 text-right">{employees.length}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <table className="w-full border-collapse border border-black text-[10px]">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="w-8 border border-black px-1 py-0.5 text-left">#</th>
                                            <th className="border border-black px-1 py-0.5 text-left">Employee Name</th>
                                            <th className="border border-black px-1 py-0.5 text-left">Position</th>
                                            <th className="border border-black px-1 py-0.5 text-left">Office</th>
                                            <th className="w-20 border border-black px-1 py-0.5 text-right">Clothing Allowance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="border border-black px-1 py-1 text-center italic">
                                                    No records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {employees.map((employee, index) => (
                                                    <tr key={employee.id}>
                                                        <td className="border border-black px-1 py-0.5">{index + 1}</td>
                                                        <td className="border border-black px-1 py-0.5 uppercase">
                                                            {employee.first_name} {employee.last_name}
                                                        </td>
                                                        <td className="border border-black px-1 py-0.5">{employee.position}</td>
                                                        <td className="border border-black px-1 py-0.5">{employee.office?.name || '-'}</td>
                                                        <td className="border border-black px-1 py-0.5 text-right font-medium">
                                                            {employee.latest_clothing_allowance
                                                                ? formatCurrency(Number(employee.latest_clothing_allowance.amount))
                                                                : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-gray-100 font-bold">
                                                    <td colSpan={4} className="border border-black px-1 py-0.5">
                                                        TOTAL
                                                    </td>
                                                    <td className="border border-black px-1 py-0.5 text-right">
                                                        {formatCurrency(totalClothingAllowance)}
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
