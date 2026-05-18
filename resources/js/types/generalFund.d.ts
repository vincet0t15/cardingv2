export interface GeneralFund {
    id: number;
    code: string;
    description: string | null;
    status: boolean;
    source_of_fund_codes_count: number;
}

export type GeneralFundCreateRequest = Omit<GeneralFund, 'id' | 'source_of_fund_codes_count'>;
