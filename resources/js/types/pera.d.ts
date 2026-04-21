import type { Employee } from './employee';

export interface Pera {
    id: number;
    employee_id: number;
    amount: number;
    effective_date: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    employee?: Employee;
    created_by_user?: {
        id: number;
        name: string;
    };
}

export interface PeraCreateRequest {
    employee_id: number;
    amount: number;
    effective_date: string;
}
