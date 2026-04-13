import PrintFooter from '@/components/print-footer';
import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface Employee {
    id: number;
    full_name: string;
    position: string;
    office: string;
    employment_status: string;
}

interface PrintProps {
    employees: Employee[];
    selectedStatus: { id: number; name: string } | null;
    filters: {
        employment_status_id: number | null;
        search: string | null;
        office_id: number | null;
    };
}

export default function EmploymentTypeReportPrint({ employees, selectedStatus, filters }: PrintProps) {
    const currentDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="mx-auto min-h-screen bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title="Employment Type Report - Print" />

            <div className="mb-4 flex justify-end print:hidden">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>

            <div className="mx-auto w-[8in] print:w-full">
                <table className="w-full border-0">
                    <thead className="hidden print:table-header-group">
                        <tr>
                            <td>
                                <div className="h-[9mm]"></div>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                {/* Header */}
                                <div className="mb-5 text-center">
                                    <h2
                                        className="m-0 text-[16px] font-bold uppercase"
                                        style={{
                                            fontFamily: '"Old English Text MT", "Times New Roman", serif',
                                        }}
                                    >
                                        EMPLOYMENT TYPE REPORT
                                    </h2>
                                    <p className="m-[5px_0] text-[12px]">
                                        {selectedStatus ? `Status: ${selectedStatus.name}` : 'All Employment Types'}
                                    </p>
                                    <p className="m-0 text-[10px] text-gray-500">Generated: {currentDate}</p>
                                </div>

                                {/* Summary */}
                                <div className="mb-4">
                                    <p className="text-[11px]">
                                        <strong>Total Employees:</strong> {employees.length}
                                    </p>
                                </div>

                                {/* Employee Table */}
                                {employees.length > 0 ? (
                                    <table className="w-full border-collapse border border-black">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="w-10 border border-black px-2 py-1 text-left text-[10px] font-semibold">#</th>
                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Employee Name</th>
                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Position</th>
                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Office</th>
                                                <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.map((employee, index) => (
                                                <tr key={employee.id}>
                                                    <td className="border border-black px-2 py-1 text-center text-[10px]">{index + 1}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px] font-medium uppercase">
                                                        {employee.full_name}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-[10px] uppercase">{employee.position}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px] uppercase">{employee.office}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px]">{employee.employment_status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-12 text-center text-[11px]">No employees found</div>
                                )}

                                {/* Footer */}
                                <PrintFooter />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0 10mm; -webkit-print-color-adjust: exact; }
                    table {
                        border-collapse: collapse;
                    }
                    td, th {
                        padding: 4px 6px !important;
                        font-size: 11px;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
