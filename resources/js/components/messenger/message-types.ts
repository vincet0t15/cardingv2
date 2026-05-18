export type UserType = { id: number; name: string; username: string; is_admin?: boolean };

export type MessageType = {
    id: number;
    body: string;
    reply_to_id: number | null;
    reply_to: { id: number; body: string | null; user: Pick<UserType, 'id' | 'name'> } | null;
    created_at: string;
    seen_at: string | null;
    seen_by: number | null;
    file_name: string | null;
    file_path: string | null;
    file_type: string | null;
    file_size: number | null;
    mime_type: string | null;
    user: Pick<UserType, 'id' | 'name'>;
    is_image: boolean;
    is_pdf: boolean;
};

export type ConversationType = {
    id: number;
    name: string | null;
    is_group: boolean;
    created_by: number | null;
    participants: UserType[];
    latest_message: MessageType | null;
    unread_count: number;
    updated_at: string;
};

export type OnlineUser = { id: number; name: string };
