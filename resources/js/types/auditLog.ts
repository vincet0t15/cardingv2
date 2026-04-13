export interface AuditLog {
    id: number;
    action: string;
    model_type: string;
    model_id: number;
    user_id: number | null;
    description: string | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        username: string;
    };
}
