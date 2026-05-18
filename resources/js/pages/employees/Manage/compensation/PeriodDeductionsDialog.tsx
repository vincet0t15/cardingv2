import PeriodDeductionsCreateForm from '@/components/PeriodDeductionsCreateForm';
import PeriodDeductionsEditForm from '@/components/PeriodDeductionsEditForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';

const MONTHS = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const startYear = 2020;
const endYear = currentYear + 5;
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => String(startYear + i));

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    employee: Employee;
    deductionTypes: DeductionType[];
    defaultMonth: string;
    defaultYear: string;
    existingDeductions: EmployeeDeduction[];
    takenPeriods: string[];
}

export function PeriodDeductionsDialog({
    open,
    setOpen,
    employee,
    deductionTypes,
    defaultMonth,
    defaultYear,
    existingDeductions,
    takenPeriods,
}: Props) {
    // Render the extracted form component

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[95vh] min-w-3xl overflow-y-auto">
                {existingDeductions.length > 0 ? (
                    <PeriodDeductionsEditForm
                        setOpen={setOpen}
                        employee={employee}
                        deductionTypes={deductionTypes}
                        defaultMonth={defaultMonth}
                        defaultYear={defaultYear}
                        existingDeductions={existingDeductions}
                        takenPeriods={takenPeriods}
                    />
                ) : (
                    <PeriodDeductionsCreateForm
                        setOpen={setOpen}
                        employee={employee}
                        deductionTypes={deductionTypes}
                        defaultMonth={defaultMonth}
                        defaultYear={defaultYear}
                        existingDeductions={existingDeductions}
                        takenPeriods={takenPeriods}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

export default PeriodDeductionsDialog;
