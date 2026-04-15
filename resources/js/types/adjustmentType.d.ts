export interface AdjustmentType {
    id: number;
    name: string;
    description: string | null;
    effect: 'positive' | 'negative';
    created_by: number;
    created_at: string;
    updated_at: string;
}
