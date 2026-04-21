export interface DeductionType {
    id: number;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface DeductionTypeCreateRequest {
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
}

export interface DeductionTypeUpdateRequest {
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
}
