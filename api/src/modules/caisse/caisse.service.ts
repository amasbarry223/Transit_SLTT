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
    // annexeId est un filtre supplémentaire DEMANDÉ, pas une autorisation :
    // sans ce contrôle, ...annexeFilter puis ...{annexeId} écrasait la
    // restriction { in: user.annexeIds } par la valeur fournie par le
    // client, laissant un non-ADMIN cibler n'importe quelle annexe.
    if (annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
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

    const montant = Number(data.montant);
    if (!Number.isFinite(montant) || montant <= 0) {
      throw new BadRequestException("Le montant doit être supérieur à 0");
    }
    if (data.type !== 'ENTREE' && data.type !== 'SORTIE') {
      throw new BadRequestException("Type de transaction invalide");
    }

    return this.prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transactionCaisse.create({
        data: {
          caisseId,
          type: data.type,
          montant,
          motif: data.motif || 'Opération de caisse',
          effectueParId: user.id,
        },
      });

      const increment = data.type === 'ENTREE' ? montant : -montant;
      // Increment atomique puis contrôle sur la valeur RÉELLE post-écriture :
      // si le solde devient négatif (sorties concurrentes), on throw et toute
      // la transaction est annulée.
      const updatedCaisse = await tx.caisse.update({
        where: { id: caisseId },
        data: { soldeActuel: { increment } },
      });
      if (updatedCaisse.soldeActuel < 0) {
        throw new BadRequestException('Solde insuffisant dans la caisse');
      }

      return { transaction, soldeActuel: updatedCaisse.soldeActuel };
    });
  }
}
