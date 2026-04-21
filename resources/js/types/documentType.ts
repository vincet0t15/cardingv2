export interface DocumentType {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    created_by: number | null;
    created_by_user?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}
