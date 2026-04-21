export interface EmploymentStatus {
    id: number;
    name: string;
    created_by: number;
}

export type EmploymentStatusCreateRequest = Omit<EmploymentStatus, 'id' | 'created_by'>