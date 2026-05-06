import { Head } from '@inertiajs/react';

interface Employee {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    position: string | null;
    office: { name: string } | null;
    employment_status: { name: string } | null;
    source_of_fund_code: { code: string; description: string | null } | null;
    salary_amount: number | null;
}

interface SourceOfFundCode {
    id: number;
    code: string;
    description: string | null;
}

interface Props {
    employees: Employee[];
    sourceOfFundCode: SourceOfFundCode | null;
    totalSalary: number;
    filters: {
        year: string | null;
    };
}

export default function EmployeesBySourceOfFundPrint({ employees, sourceOfFundCode, totalSalary, filters }: Props) {
    const getFullName = (employee: Employee) => {
        const parts = [employee.first_name, employee.middle_name, employee.last_name, employee.suffix].filter(Boolean);
        return parts.join(' ');
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '—';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const currentDate = new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const getFilterDescription = () => {
        if (filters.year) {
            return `Year ${filters.year}`;
        }
        return 'All Years';
    };

    return (
        <div className="mx-auto min-h-screen bg-white p-4 font-sans text-[11px] leading-[1.3] text-black print:max-w-none print:p-0">
            <Head title={`Employee List by Source of Fund`} />

            <div className="mb-4 flex justify-end print:hidden">
                <button onClick={() => window.print()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    Print Report
                </button>
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
                                <div className="mb-5 text-center">
                                    <h2
                                        className="m-0 text-[16px] font-bold uppercase"
                                        style={{
                                            fontFamily: '"Old English Text MT", "Times New Roman", serif',
                                        }}
                                    >
                                        EMPLOYEE LIST BY SOURCE OF FUND
                                    </h2>
                                    {sourceOfFundCode ? (
                                        <>
                                            <p className="m-[5px_0] text-[14px] font-bold">{sourceOfFundCode.code}</p>
                                            {sourceOfFundCode.description && <p className="m-0 text-[12px]">{sourceOfFundCode.description}</p>}
                                        </>
                                    ) : (
                                        <p className="m-[5px_0] text-[14px] font-bold">ALL SOURCE OF FUNDS</p>
                                    )}
                                    <p className="m-0 text-[10px] text-gray-500">
                                        {getFilterDescription()} • Generated: {currentDate}
                                    </p>
                                </div>

                                <table className="w-full border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th
                                                className="border border-black px-2 py-1 text-left text-[10px] font-semibold"
                                                style={{ width: '40px' }}
                                            >
                                                #
                                            </th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Employee Name</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Position</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Office</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Status</th>
                                            <th className="border border-black px-2 py-1 text-left text-[10px] font-semibold">Source of Fund</th>
                                            <th className="border border-black px-2 py-1 text-right text-[10px] font-semibold">Monthly Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.length > 0 ? (
                                            employees.map((employee, index) => (
                                                <tr key={employee.id}>
                                                    <td className="border border-black px-2 py-1 text-[10px]">{index + 1}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px] uppercase">{getFullName(employee)}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px]">{employee.position || '—'}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px]">{employee.office?.name || '—'}</td>
                                                    <td className="border border-black px-2 py-1 text-[10px]">
                                                        {employee.employment_status?.name || '—'}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-[10px]">
                                                        {employee.source_of_fund_code?.code || '—'}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px]">
                                                        {formatCurrency(employee.salary_amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="border border-black px-2 py-4 text-center text-[10px] text-gray-500">
                                                    No employees found
                                                </td>
                                            </tr>
                                        )}
                                        {employees.length > 0 && (
                                            <>
                                                <tr className="bg-gray-100 font-bold">
                                                    <td className="border border-black px-2 py-1 text-[10px]" colSpan={6}>
                                                        TOTAL EMPLOYEES: {employees.length}
                                                    </td>
                                                    <td className="border border-black px-2 py-1 text-right text-[10px]">
                                                        {formatCurrency(totalSalary)}
                                                    </td>
                                                </tr>
                                                <tr className="bg-gray-200 font-bold">
                                                    <td className="border border-black px-2 py-2 text-[11px]" colSpan={6}>
                                                        GRAND TOTAL MONTHLY SALARY
                                                    </td>
                                                    <td className="border border-black px-2 py-2 text-right text-[11px]">
                                                        {formatCurrency(totalSalary)}
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>

                                <div className="mt-8 text-center text-[9px] text-gray-500">
                                    <p>This is a computer-generated report and does not require a signature.</p>
                                </div>
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