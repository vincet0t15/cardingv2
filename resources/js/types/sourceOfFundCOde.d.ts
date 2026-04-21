export interface SourceOfFundCode {
    id: number;
    code: string;
    description: string | null;
    status: boolean;
    parent_id: number | null;
    is_category: boolean;
    general_fund_id: number | null;
    parent?: {
        id: number;
        code: string;
        name: string;
    } | null;
}

export interface SourceOfFundCodeCreate {
    [key: string]: any;
    code: string;
    description: string;
    status: boolean;
    parent_id: number | null;
    is_category: boolean;
    general_fund_id: number | null;
}
