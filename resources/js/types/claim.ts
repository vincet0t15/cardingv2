import type { ClaimType } from './claimType';

export interface Claim {
    id: number;
    employee_id: number;
    salary_id?: number | null;
    claim_type_id: number;
    claim_date: string;
    amount: number;
    purpose: string;
    remarks: string | null;
    reference_number?: string | null;
    created_at: string;
    updated_at: string;
    claim_type?: ClaimType;
    salary?: {
        id: number;
        amount: number;
        effective_date: string;
    };
}

export interface ClaimFilters {
    claim_month?: string;
    claim_year?: string;
    claim_type_id?: string;
}


export type ClaimForm = {
    employee_id: number;
    salary_id?: number | null;
    salary_amount?: number;
    claim_type_id: number;
    claim_date: string;
    amount: number;
    purpose: string;
    remarks: string | null;
};
