export interface LinkProps {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedDataResponse<dataFromdatabase> {
    current_page: number;
    data: dataFromdatabase[];
    first_page_url?: string | null;
    from: number;
    last_page: number;
    last_page_url?: string | null;
    links: LinkProps[];
    next_page_url?: string | null;
    path: string;
    per_page: number;
    prev_page_url?: string | null;
    to: number;
    total: number;
}

export interface PaginationData {
    search: string;
    meta: MetaProps;
}
