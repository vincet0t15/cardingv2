import type { Employee } from './employee';

export interface ClothingAllowance {
    id: number;
    employee_id: number;
    amount: number;
    start_date: string;
    end_date?: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    employee?: Employee;
    created_by_user?: {
        id: number;
        name: string;
    };
    source_of_fund_code?: {
        id: number;
        code: string;
        description: string | null;
        status: boolean;
    } | null;
}

export interface ClothingAllowanceCreateRequest {
    employee_id: number;
    amount: number;
    start_date: string;
    end_date?: string | null;
    source_of_fund_code_id?: number | null;
}
