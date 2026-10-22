import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

type NotificationWriter = Pick<PrismaService, 'notification'> | Prisma.TransactionClient;

export interface NotificationContent {
  titre: string;
  message: string;
  lien?: string;
}

const MAX_LIST_LIMIT = 50;
// titre/message sont des VARCHAR(191) (String Prisma par défaut sur MySQL) :
// un texte plus long ferait échouer l'insertion en mode strict.
const MAX_TEXT = 191;

function clip(text: string): string {
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Destinataires d'un événement d'annexe : tous les administrateurs actifs
   *  + les comptables actifs rattachés à cette annexe, jamais l'auteur de
   *  l'action (il sait déjà ce qu'il vient de faire). */
  async recipientsForAnnexe(annexeId: string, excludeUserId?: string): Promise<string[]> {
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

  /** `tx` optionnel : même contrat que AuditLogsService.log. */
  async notifyUsers(userIds: string[], content: NotificationContent, tx: NotificationWriter = this.prisma) {
    const unique = Array.from(new Set(userIds));
    if (unique.length === 0) return { count: 0 };
    return tx.notification.createMany({
      data: unique.map((userId) => ({
        userId,
        titre: clip(content.titre),
        message: clip(content.message),
        lien: content.lien ?? null,
      })),
    });
  }

  async listForUser(userId: string, limit?: number) {
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

  /** Filtre sur userId dans la même requête : une notification d'un autre
   *  utilisateur répond 404, sans révéler qu'elle existe. */
  async markRead(id: string, userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { lue: true },
    });
    if (res.count === 0) throw new NotFoundException('Notification introuvable');
    return { id, lue: true };
  }

  async markAllRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { userId, lue: false },
      data: { lue: true },
    });
    return { count: res.count };
  }
}
