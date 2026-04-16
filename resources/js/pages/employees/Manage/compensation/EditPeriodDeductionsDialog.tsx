import type { DeductionType } from '@/types/deductionType';
import type { Employee } from '@/types/employee';
import type { EmployeeDeduction } from '@/types/employeeDeduction';
import { SalaryDialog } from './salaryDialog';

interface EditPeriodDeductionsDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    employee: Employee;
    deductionTypes: DeductionType[];
    defaultMonth: string;
    defaultYear: string;
    existingDeductions: EmployeeDeduction[];
    takenPeriods: string[];
}

export function EditPeriodDeductionsDialog({
    open,
    setOpen,
    employee,
    deductionTypes,
    defaultMonth,
    defaultYear,
    existingDeductions,
    takenPeriods,
}: EditPeriodDeductionsDialogProps) {
    return (
        <>
            {open && (
                <SalaryDialog
                    open={open}
                    onClose={() => setOpen(false)}
                    employee={employee}
                    deductionTypes={deductionTypes}
                    defaultMonth={defaultMonth}
                    defaultYear={defaultYear}
                    existingDeductions={existingDeductions}
                    takenPeriods={takenPeriods}
                />
            )}
        </>
    );
}

export default EditPeriodDeductionsDialog;
