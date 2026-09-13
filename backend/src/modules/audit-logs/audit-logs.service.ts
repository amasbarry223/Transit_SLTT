import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

type AuditLogWriter = Pick<PrismaService, 'auditLog'> | Prisma.TransactionClient;

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { entite?: string; action?: string; limit?: number }) {
    const limit = Number(query.limit) || 50;
    return this.prisma.auditLog.findMany({
      where: {
        ...(query.entite ? { entite: query.entite } : {}),
        ...(query.action ? { action: query.action } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, nom: true, email: true, role: true } },
      },
    });
  }

  /** `tx` optionnel : passer le client de transaction d'un appelant (ex.
   *  UsersService) pour que l'écriture d'audit s'engage ou échoue avec la
   *  mutation qu'elle documente, jamais l'une sans l'autre. */
  async log(
    data: {
      userId?: string;
      action: string;
      entite: string;
      entiteId?: string;
      donnees?: any;
      adresseIp?: string;
      userAgent?: string;
    },
    tx: AuditLogWriter = this.prisma,
  ) {
    return tx.auditLog.create({
      data: {
        ...data,
        donnees: data.donnees ?? undefined,
      },
    });
  }
}
