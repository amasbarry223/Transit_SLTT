import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class CaisseService {
  constructor(private readonly prisma: PrismaService) {}

  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { annexeId: { in: user.annexeIds } };
  }

  async findAll(user: CurrentUserType, annexeId?: string) {
    const annexeFilter = this.buildAnnexeFilter(user);
    return this.prisma.caisse.findMany({
      where: {
        ...annexeFilter,
        ...(annexeId ? { annexeId } : {}),
      },
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string, user: CurrentUserType) {
    const caisse = await this.prisma.caisse.findUnique({
      where: { id },
      include: {
        annexe: true,
        transactions: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            effectuePar: { select: { id: true, nom: true } },
            facture: { select: { id: true, numero: true } },
            depense: { select: { id: true, numero: true } },
          },
        },
      },
    });

    if (!caisse) throw new NotFoundException(`Caisse ${id} non trouvée`);

    if (user.role !== 'ADMIN' && !user.annexeIds.includes(caisse.annexeId)) {
      throw new ForbiddenException("Accès non autorisé à cette caisse");
    }

    return caisse;
  }

  async createTransaction(
    caisseId: string,
    user: CurrentUserType,
    data: {
      type: 'ENTREE' | 'SORTIE';
      montant: number;
      motif: string;
    },
  ) {
    const caisse = await this.findOne(caisseId, user);

    if (caisse.statut === 'FERMEE') {
      throw new BadRequestException("Cette caisse est fermée aux opérations");
    }

    if (data.type === 'SORTIE' && caisse.soldeActuel < data.montant) {
      throw new BadRequestException("Solde insuffisant dans la caisse");
    }

    return this.prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transactionCaisse.create({
        data: {
          caisseId,
          type: data.type,
          montant: data.montant,
          motif: data.motif,
          effectueParId: user.id,
        },
      });

      const increment = data.type === 'ENTREE' ? data.montant : -data.montant;
      const updatedCaisse = await tx.caisse.update({
        where: { id: caisseId },
        data: { soldeActuel: { increment } },
      });

      return { transaction, soldeActuel: updatedCaisse.soldeActuel };
    });
  }
}
