import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  async log(data: {
    userId?: string;
    action: string;
    entite: string;
    entiteId?: string;
    donnees?: any;
    adresseIp?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        donnees: data.donnees ?? undefined,
      },
    });
  }
}
