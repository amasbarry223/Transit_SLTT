import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
import type { CreateBonLivraisonDto } from './dto/create-bon-livraison.dto';
import type { UpdateBonLivraisonDto } from './dto/update-bon-livraison.dto';

export interface LigneLivraison {
  marchandise: string;
  quantite: number;
  unite: string;
}

const INCLUDE = {
  annexe: { select: { id: true, nom: true, code: true } },
  client: { select: { id: true, nom: true, adresse: true, ville: true, telephone: true } },
  bonSortie: { select: { id: true, reference: true } },
} as const;

@Injectable()
export class BonsLivraisonService {
  constructor(private prisma: PrismaService) {}

  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { annexeId: { in: user.annexeIds } };
  }

  private assertAnnexeAccess(user: CurrentUserType, annexeId: string) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce bon de livraison');
    }
  }

  /** Une quantité nulle ou négative sur un document de livraison n'a pas de
   *  sens, et le total livré ne peut pas dépasser ce qui est sorti du stock. */
  private normalizeLignes(lignes: { marchandise: string; quantite: number; unite?: string }[], uniteParDefaut: string, maxQuantite: number): LigneLivraison[] {
    const normalized = lignes.map((l) => {
      const quantite = Number(l.quantite);
      if (!l.marchandise?.trim()) throw new BadRequestException('Chaque ligne doit indiquer une marchandise.');
      if (!Number.isFinite(quantite) || quantite <= 0) {
        throw new BadRequestException('La quantité de chaque ligne doit être supérieure à 0.');
      }
      return { marchandise: l.marchandise.trim(), quantite, unite: l.unite?.trim() || uniteParDefaut };
    });
    const total = normalized.reduce((acc, l) => acc + l.quantite, 0);
    if (total > maxQuantite + 1e-9) {
      throw new BadRequestException(
        `La quantité livrée (${total}) dépasse la quantité du bon de sortie (${maxQuantite}).`,
      );
    }
    return normalized;
  }

  /** Référence LIV-AAAA-NNNN générée serveur — même stratégie que
   *  RecusPaiementService.nextRecuReference (vérifie puis choisit, relance
   *  une fois sur P2002). Préfixe LIV et non BL : "BL" désigne déjà le
   *  connaissement (numeroBl) partout dans l'application. */
  private async nextReference(): Promise<string> {
    const prefix = `LIV-${new Date().getFullYear()}-`;
    const last = await this.prisma.bonLivraison.findFirst({
      where: { reference: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
      select: { reference: true },
    });
    const lastNum = Number(String(last?.reference ?? '').slice(prefix.length)) || 0;
    for (let n = lastNum + 1; n < lastNum + 50; n++) {
      const candidate = `${prefix}${String(n).padStart(4, '0')}`;
      const exists = await this.prisma.bonLivraison.findUnique({ where: { reference: candidate }, select: { id: true } });
      if (!exists) return candidate;
    }
    return `${prefix}${Date.now()}`;
  }

  /** Transporteur choisi dans la liste : son nom et son immatriculation
   *  servent de valeurs par défaut (modifiables : camion de remplacement). */
  private async resolveTransporteur(transporteurId: string | undefined, annexeId: string) {
    if (!transporteurId) return null;
    const t = await this.prisma.transporteur.findUnique({
      where: { id: transporteurId },
      select: { id: true, nom: true, immatriculation: true, annexeId: true },
    });
    if (!t) throw new BadRequestException('Transporteur introuvable.');
    if (t.annexeId && t.annexeId !== annexeId) {
      throw new BadRequestException("Ce transporteur n'est pas rattaché à l'annexe du bon.");
    }
    return t;
  }

  async findAll(user: CurrentUserType, params?: { annexeId?: string; clientId?: string }) {
    if (params?.annexeId) this.assertAnnexeAccess(user, params.annexeId);
    return this.prisma.bonLivraison.findMany({
      where: {
        ...this.buildAnnexeFilter(user),
        ...(params?.annexeId ? { annexeId: params.annexeId } : {}),
        ...(params?.clientId ? { clientId: params.clientId } : {}),
      },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: CurrentUserType) {
    const bon =
      (await this.prisma.bonLivraison.findUnique({ where: { id }, include: INCLUDE })) ??
      (await this.prisma.bonLivraison.findFirst({ where: { reference: id }, include: INCLUDE }));
    if (!bon) throw new NotFoundException(`Bon de livraison ${id} non trouvé`);
    this.assertAnnexeAccess(user, bon.annexeId);
    return bon;
  }

  async create(user: CurrentUserType, data: CreateBonLivraisonDto) {
    const bonSortie = await this.prisma.bonSortie.findUnique({
      where: { id: data.bonSortieId },
      include: { client: { select: { nom: true, adresse: true, ville: true } }, bonLivraison: { select: { reference: true } } },
    });
    if (!bonSortie) throw new NotFoundException('Bon de sortie introuvable.');
    this.assertAnnexeAccess(user, bonSortie.annexeId);
    if (bonSortie.statut !== 'Validé') {
      throw new BadRequestException('Seul un bon de sortie validé peut donner lieu à un bon de livraison.');
    }
    if (bonSortie.bonLivraison) {
      throw new ConflictException(
        `Le bon de sortie ${bonSortie.reference} a déjà un bon de livraison (${bonSortie.bonLivraison.reference}).`,
      );
    }

    const lignes = this.normalizeLignes(
      data.lignes?.length
        ? data.lignes
        : [{ marchandise: bonSortie.marchandise, quantite: bonSortie.quantite, unite: bonSortie.unite }],
      bonSortie.unite,
      bonSortie.quantite,
    );
    const transporteur = await this.resolveTransporteur(data.transporteurId, bonSortie.annexeId);
    const adresseClient = [bonSortie.client?.adresse, bonSortie.client?.ville].filter(Boolean).join(', ');

    const buildData = (reference: string) => ({
      reference,
      date: data.date || new Date().toISOString().slice(0, 10),
      bonSortieId: bonSortie.id,
      clientId: bonSortie.clientId,
      clientNom: bonSortie.clientNom || bonSortie.client?.nom || '',
      annexeId: bonSortie.annexeId,
      lignes: lignes as unknown as Prisma.InputJsonValue,
      transporteurId: transporteur?.id ?? null,
      transporteurNom: data.transporteurNom?.trim() || transporteur?.nom || null,
      immatriculation: data.immatriculation?.trim() || transporteur?.immatriculation || null,
      chauffeurNom: data.chauffeurNom?.trim() || null,
      chauffeurTelephone: data.chauffeurTelephone?.trim() || null,
      adresseLivraison: data.adresseLivraison?.trim() || adresseClient || null,
      observations: data.observations?.trim() || null,
      statut: 'En cours',
      creePar: user.nom,
    });

    try {
      return await this.prisma.bonLivraison.create({ data: buildData(await this.nextReference()), include: INCLUDE });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
      // P2002 sur bonSortieId : une création concurrente pour le même bon de
      // sortie a gagné — c'est un vrai doublon, pas une collision de numéro.
      const target = String((err.meta as { target?: unknown } | undefined)?.target ?? '');
      if (target.includes('bon_sortie_id') || target.includes('bonSortieId')) {
        throw new ConflictException(`Le bon de sortie ${bonSortie.reference} a déjà un bon de livraison.`);
      }
      return this.prisma.bonLivraison.create({ data: buildData(await this.nextReference()), include: INCLUDE });
    }
  }

  async update(id: string, user: CurrentUserType, data: UpdateBonLivraisonDto) {
    const bon = await this.findOne(id, user);
    if (bon.statut === 'Livré') {
      throw new BadRequestException('Un bon de livraison livré ne peut plus être modifié.');
    }

    let lignes: LigneLivraison[] | undefined;
    if (data.lignes?.length) {
      const bonSortie = await this.prisma.bonSortie.findUnique({
        where: { id: bon.bonSortieId },
        select: { quantite: true, unite: true },
      });
      lignes = this.normalizeLignes(data.lignes, bonSortie?.unite ?? 'colis', bonSortie?.quantite ?? 0);
    }
    const transporteur =
      data.transporteurId !== undefined ? await this.resolveTransporteur(data.transporteurId || undefined, bon.annexeId) : undefined;

    const str = (v: string | undefined) => (v === undefined ? undefined : v.trim() || null);
    // Conditionné au statut (même pattern que BonsService.updateBon) : un
    // passage à "Livré" concurrent ne peut pas être écrasé par une édition.
    const updated = await this.prisma.bonLivraison.updateMany({
      where: { id: bon.id, statut: { not: 'Livré' } },
      data: {
        ...(data.date !== undefined ? { date: data.date } : {}),
        ...(lignes ? { lignes: lignes as unknown as Prisma.InputJsonValue } : {}),
        ...(transporteur !== undefined
          ? {
              transporteurId: transporteur?.id ?? null,
              transporteurNom: str(data.transporteurNom) ?? transporteur?.nom ?? null,
              immatriculation: str(data.immatriculation) ?? transporteur?.immatriculation ?? null,
            }
          : {
              ...(data.transporteurNom !== undefined ? { transporteurNom: str(data.transporteurNom) } : {}),
              ...(data.immatriculation !== undefined ? { immatriculation: str(data.immatriculation) } : {}),
            }),
        ...(data.chauffeurNom !== undefined ? { chauffeurNom: str(data.chauffeurNom) } : {}),
        ...(data.chauffeurTelephone !== undefined ? { chauffeurTelephone: str(data.chauffeurTelephone) } : {}),
        ...(data.adresseLivraison !== undefined ? { adresseLivraison: str(data.adresseLivraison) } : {}),
        ...(data.observations !== undefined ? { observations: str(data.observations) } : {}),
        ...(data.statut !== undefined ? { statut: data.statut } : {}),
      },
    });
    if (updated.count === 0) {
      throw new BadRequestException('Un bon de livraison livré ne peut plus être modifié.');
    }
    return this.prisma.bonLivraison.findUnique({ where: { id: bon.id }, include: INCLUDE });
  }

  async remove(id: string, user: CurrentUserType) {
    const bon = await this.findOne(id, user);
    const deleted = await this.prisma.bonLivraison.deleteMany({ where: { id: bon.id, statut: { not: 'Livré' } } });
    if (deleted.count === 0) {
      throw new BadRequestException('Un bon de livraison livré ne peut pas être supprimé.');
    }
    return { id: bon.id };
  }
}
