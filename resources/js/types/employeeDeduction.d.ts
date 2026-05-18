import type { Employee } from './employee';
import type { DeductionType } from './deductionType';

export interface EmployeeDeduction {
    id: number;
    employee_id: number;
    salary_id?: number | null;
    deduction_type_id: number;
    amount: number;
    pay_period_month: number;
    pay_period_year: number;
    notes?: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    employee?: Employee;
    salary?: {
        id: number;
        amount: number;
        effective_date: string;
    };
    deduction_type?: DeductionType;
}

export interface EmployeeDeductionCreateRequest {
    employee_id: number;
    deduction_type_id: number;
    amount: number;
    pay_period_month: number;
    pay_period_year: number;
    notes?: string;
}

export interface EmployeeDeductionUpdateRequest {
    amount: number;
    notes?: string;
}
