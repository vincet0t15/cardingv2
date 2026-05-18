export interface DeleteRequest {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    requested_by: number;
    created_at: string;
}

export interface Office {
    id: number;
    name: string;
    code: string;
    created_by: number;
    deleteRequest?: DeleteRequest | null;
}

export type OfficeCreateRequest = Omit<Office, 'id' | 'created_by' | 'deleteRequest'>;
