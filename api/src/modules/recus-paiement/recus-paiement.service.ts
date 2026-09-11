import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

/** Statut d'un reçu à partir de la somme due et du montant payé, avec tolérance d'arrondi. */
function statutRecu(somme: number, montantPaye: number): 'SOLDE' | 'PARTIEL' | 'EN_ATTENTE' {
  const reste = Math.max(0, Math.round((somme - montantPaye) * 100) / 100);
  if (reste < 0.5) return 'SOLDE';
  return montantPaye > 0 ? 'PARTIEL' : 'EN_ATTENTE';
}

@Injectable()
export class RecusPaiementService {
  constructor(private prisma: PrismaService) {}

  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { annexeId: { in: user.annexeIds } };
  }

  async findAll(user: CurrentUserType, params?: { search?: string; annexeId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    const where: any = {
      AND: [
        this.buildAnnexeFilter(user),
        params?.annexeId ? { annexeId: params.annexeId } : {},
        params?.search
          ? {
              OR: [
                { reference: { contains: params.search } },
                { nom: { contains: params.search } },
                { prenom: { contains: params.search } },
                { motif: { contains: params.search } },
              ],
            }
          : {},
      ],
    };
    return this.prisma.recuPaiement.findMany({
      where,
      include: { annexe: { select: { id: true, nom: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: CurrentUserType) {
    const item = await this.prisma.recuPaiement.findUnique({
      where: { id },
      include: { annexe: true },
    });
    if (!item) throw new NotFoundException(`Reçu ${id} non trouvé`);
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(item.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce reçu');
    }
    return item;
  }

  async create(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de reçu pour cette annexe');
    }
    const somme = Number(data.somme) || 0;
    const montantPaye = Number(data.montantPaye) || 0;
    const reste = Math.max(0, Math.round((somme - montantPaye) * 100) / 100);
    const statut = statutRecu(somme, montantPaye);

    if (data.reference) {
      const existing = await this.prisma.recuPaiement.findUnique({
        where: { reference: data.reference },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(`Le reçu ${data.reference} existe déjà.`);
      }
    }

    return this.prisma.recuPaiement.create({
      data: {
        reference: data.reference,
        annexeId: data.annexeId,
        nom: data.nom,
        prenom: data.prenom,
        somme,
        motif: data.motif || '',
        montantPaye,
        reste,
        statut,
        // Attribution fiable : nom de l'auteur pris du JWT, jamais d'un
        // champ texte libre fourni par le client.
        creePar: user.nom,
      },
      include: { annexe: true },
    });
  }

  async update(id: string, user: CurrentUserType, data: any) {
    const current = await this.findOne(id, user);
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas rattacher ce reçu à cette annexe');
    }
    // Champs non modifiables directement (recalculés ou techniques).
    const { reste: _r, statut: _s, id: _id, createdAt: _c, updatedAt: _u, ...safe } = data;
    const updateData: any = { ...safe };
    if (data.somme !== undefined || data.montantPaye !== undefined) {
      const somme = data.somme !== undefined ? Number(data.somme) || 0 : current.somme;
      const montantPaye =
        data.montantPaye !== undefined ? Number(data.montantPaye) || 0 : current.montantPaye;
      updateData.somme = somme;
      updateData.montantPaye = montantPaye;
      updateData.reste = Math.max(0, Math.round((somme - montantPaye) * 100) / 100);
      updateData.statut = statutRecu(somme, montantPaye);
    }

    return this.prisma.recuPaiement.update({
      where: { id },
      data: updateData,
      include: { annexe: true },
    });
  }

  async delete(id: string, user: CurrentUserType) {
    await this.findOne(id, user);
    return this.prisma.recuPaiement.delete({ where: { id } });
  }
}
