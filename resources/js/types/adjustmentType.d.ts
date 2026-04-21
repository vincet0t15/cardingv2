export interface AdjustmentType {
    id: number;
    name: string;
    description: string | null;
    effect: 'positive' | 'negative';

    created_by?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}
