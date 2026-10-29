import { NotificationsService } from './notifications.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    list(user: CurrentUserType, limit?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            titre: string;
            lien: string | null;
            message: string;
            lue: boolean;
        }[];
        unreadCount: number;
    }>;
    markAllRead(user: CurrentUserType): Promise<{
        count: number;
    }>;
    markRead(id: string, user: CurrentUserType): Promise<{
        id: string;
        lue: boolean;
    }>;
}
