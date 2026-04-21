export interface Office {
    id: number;
    name: string;
    code: string;
    created_by: number;
}

export type OfficeCreateRequest = Omit<Office, 'id' | 'created_by'>