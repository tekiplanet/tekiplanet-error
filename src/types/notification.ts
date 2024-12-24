export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    action_url?: string;
    icon?: string;
} 