import type { Employee } from './employee';
import type { Salary } from './salary';
import type { Pera } from './pera';
import type { Rata } from './rata';
import type { EmployeeDeduction } from './employeeDeduction';

export interface PayrollEmployee extends Employee {
    current_salary: number;
    current_pera: number;
    current_rata: number;
    total_deductions: number;
    gross_pay: number;
    net_pay: number;
    deductions?: EmployeeDeduction[];
}

export interface PayrollFilters {
    month: number;
    year: number;
    office_id?: number;
    search?: string;
}

export interface PayrollShowData {
    employee: Employee;
    salaryHistory: Salary[];
    peraHistory: Pera[];
    rataHistory: Rata[];
    deductions: EmployeeDeduction[];
    filters: {
        month: number;
        year: number;
    };
}
