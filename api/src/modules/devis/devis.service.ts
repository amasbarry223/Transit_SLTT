import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

/**
 * Recalcule HT / TVA / TTC d'un devis à partir de ses lignes.
 *
 * Un devis SLTT est une estimation de 3 postes de coûts (droit de douane,
 * frais de circuit, frais de prestation) — pas une facture taxable : le
 * front (DevisInput/DevisData, formulaires, impression) n'a aucun champ ni
 * aucune UI de TVA. Une ancienne version appliquait ici un taux de TVA de
 * 18 % codé en dur, invisible du front : `montant_ttc` en base gonflait de
 * 18 % par rapport au « Total estimé » affiché, et redescendait tel quel
 * dans `devis.total` au rechargement de page (data-fetch-slice lit
 * `montantTtc ?? montantHt`) — un devis affichant 2 900 000 FCFA à la
 * création se retrouvait à 3 422 000 FCFA après un simple F5, et cette
 * valeur gonflée se propageait ensuite au montant investi du dossier créé
 * par conversion. montantTva reste à 0 et montantTtc == montantHt.
 */
function computeDevisTotals(lignes: any[]) {
  let montantHt = 0;
  const lignesFormatted = (lignes || []).map((l: any) => {
    const quantite = Number(l.quantite) || 1;
    const prixUnitaire = Number(l.prixUnitaire) || 0;
    const montantTotal = quantite * prixUnitaire;
    montantHt += montantTotal;
    return { designation: l.designation, quantite, prixUnitaire, montantTotal };
  });
  return { montantHt, montantTva: 0, montantTtc: montantHt, lignesFormatted };
}

@Injectable()
export class DevisService {
  constructor(private readonly prisma: PrismaService) {}

  /** Comme pour les clients, un devis sans annexe reste visible de tous —
   *  seul un devis explicitement rattaché à une annexe est restreint. */
  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
  }

  async findAll(user: CurrentUserType, clientId?: string) {
    return this.prisma.devis.findMany({
      where: {
        ...this.buildAnnexeFilter(user),
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: { select: { id: true, nom: true, code: true } },
        annexe: { select: { id: true, nom: true, code: true } },
        port: { select: { id: true, nom: true, code: true } },
        lignes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: CurrentUserType) {
    const devis = await this.prisma.devis.findUnique({
      where: { id },
      include: { client: true, annexe: true, port: true, lignes: true },
    });
    if (!devis) throw new NotFoundException(`Devis ${id} non trouvé`);

    if (devis.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(devis.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce devis');
    }

    return devis;
  }

  async create(user: CurrentUserType, data: any) {
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de devis pour cette annexe');
    }

    const existing = await this.prisma.devis.findUnique({ where: { numero: data.numero } });
    if (existing) throw new ConflictException(`Le numéro de devis ${data.numero} existe déjà`);

    const { montantHt, montantTva, montantTtc, lignesFormatted } = computeDevisTotals(data.lignes);

    return this.prisma.devis.create({
      data: {
        numero: data.numero,
        clientId: data.clientId,
        annexeId: data.annexeId || null,
        dossierId: data.dossierId || null,
        portId: data.portId || null,
        nature: data.nature || null,
        dateEmission: data.dateEmission ? new Date(data.dateEmission) : new Date(),
        dateValidite: data.dateValidite ? new Date(data.dateValidite) : undefined,
        notes: data.notes ?? null,
        montantHt,
        montantTva,
        montantTtc,
        lignes: { create: lignesFormatted },
      },
      include: { lignes: true, client: true, annexe: true, port: true },
    });
  }

  async update(id: string, user: CurrentUserType, data: any) {
    const current = await this.findOne(id, user);
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas rattacher ce devis à cette annexe');
    }
    const updateData: any = {};

    // Liste blanche : le front renvoie parfois l'entité mappée entière.
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.annexeId !== undefined) updateData.annexeId = data.annexeId || null;
    if (data.dossierId !== undefined) {
      // Un devis déjà converti ne se rattache pas à un autre dossier.
      if (current.dossierId && data.dossierId && current.dossierId !== data.dossierId) {
        throw new ConflictException('Ce devis est déjà rattaché à un dossier.');
      }
      updateData.dossierId = data.dossierId || null;
    }
    if (data.portId !== undefined) updateData.portId = data.portId || null;
    if (data.nature !== undefined) updateData.nature = data.nature || null;
    if (data.notes !== undefined) updateData.notes = data.notes ?? null;
    if (data.statut !== undefined) updateData.statut = data.statut;
    if (data.dateEmission) updateData.dateEmission = new Date(data.dateEmission);
    if (data.dateValidite) updateData.dateValidite = new Date(data.dateValidite);

    if (data.lignes) {
      const { montantHt, montantTva, montantTtc, lignesFormatted } = computeDevisTotals(data.lignes);
      updateData.montantHt = montantHt;
      updateData.montantTva = montantTva;
      updateData.montantTtc = montantTtc;
      updateData.lignes = { create: lignesFormatted };
    }

    return this.prisma.$transaction(async (tx: any) => {
      if (data.lignes) {
        await tx.ligneDevis.deleteMany({ where: { devisId: id } });
      }
      return tx.devis.update({
        where: { id },
        data: updateData,
        include: { lignes: true, client: true, annexe: true, port: true },
      });
    });
  }

  async delete(id: string, user: CurrentUserType) {
    await this.findOne(id, user);
    return this.prisma.devis.delete({ where: { id } });
  }
}
