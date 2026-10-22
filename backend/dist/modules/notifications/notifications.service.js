"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const MAX_LIST_LIMIT = 50;
const MAX_TEXT = 191;
function clip(text) {
    return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
}
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recipientsForAnnexe(annexeId, excludeUserId) {
        const profiles = await this.prisma.profile.findMany({
            where: {
                actif: true,
                ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
                OR: [{ role: 'ADMIN' }, { role: 'COMPTABLE', userAnnexes: { some: { annexeId } } }],
            },
            select: { id: true },
        });
        return profiles.map((p) => p.id);
    }
    async notifyUsers(userIds, content, tx = this.prisma) {
        const unique = Array.from(new Set(userIds));
        if (unique.length === 0)
            return { count: 0 };
        return tx.notification.createMany({
            data: unique.map((userId) => ({
                userId,
                titre: clip(content.titre),
                message: clip(content.message),
                lien: content.lien ?? null,
            })),
        });
    }
    async listForUser(userId, limit) {
        const take = Math.min(Math.max(Number(limit) || 20, 1), MAX_LIST_LIMIT);
        const [items, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take,
            }),
            this.prisma.notification.count({ where: { userId, lue: false } }),
        ]);
        return { items, unreadCount };
    }
    async markRead(id, userId) {
        const res = await this.prisma.notification.updateMany({
            where: { id, userId },
            data: { lue: true },
        });
        if (res.count === 0)
            throw new common_1.NotFoundException('Notification introuvable');
        return { id, lue: true };
    }
    async markAllRead(userId) {
        const res = await this.prisma.notification.updateMany({
            where: { userId, lue: false },
            data: { lue: true },
        });
        return { count: res.count };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map