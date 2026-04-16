export interface AdjustmentType {
    id: number;
    name: string;
    description: string | null;
    effect: 'positive' | 'negative';
    taxable?: boolean;
    include_in_payroll?: boolean;
    created_by?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}
