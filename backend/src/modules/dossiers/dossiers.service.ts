import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
import { buildAnnexeScopeFilter, assertAnnexeAccess } from '../../common/annexe-filter.utils';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination.utils';
import { CATEGORIES_DEPENSE, MODES_PAIEMENT, calculerFinancesDossier, toFcfa } from './dossier-finances';

function normalizeVoieTransport(val?: string): 'MARITIME' | 'AERIEN' | 'TERRESTRE' | undefined {
  if (!val) return undefined;
  const upper = String(val).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (upper.includes('AER')) return 'AERIEN';
  if (upper.includes('ROUT') || upper.includes('TERR') || upper.includes('FERR')) return 'TERRESTRE';
  if (upper.includes('MAR')) return 'MARITIME';
  return 'MARITIME';
}

function normalizeStatutDossier(
  val?: string,
): 'BROUILLON' | 'EN_COURS' | 'EN_DEDOUANEMENT' | 'EN_ATTENTE_LIVRAISON' | 'LIVRE' | 'CLOTURE' | 'ANNULE' | undefined {
  if (!val) return undefined;
  const upper = String(val).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
  if (upper.includes('BROUILLON')) return 'BROUILLON';
  if (upper.includes('DEDOUAN')) return 'EN_DEDOUANEMENT';
  // "ATTENTE" doit être testé avant "LIVR" : "EN_ATTENTE_LIVRAISON" contient
  // la sous-chaîne "LIVR" (de "LIVRAISON") et se faisait donc toujours
  // classer comme "LIVRE" — ce statut était inatteignable.
  if (upper.includes('ATTENTE')) return 'EN_ATTENTE_LIVRAISON';
  if (upper.includes('LIVR')) return 'LIVRE';
  if (upper.includes('SOLDE') || upper.includes('CLOTUR')) return 'CLOTURE';
  if (upper.includes('ANNUL')) return 'ANNULE';
  if (upper.includes('COURS')) return 'EN_COURS';
  return 'EN_COURS';
}

function parseDossierDate(val?: any): Date | null | undefined {
  if (val === null) return null;
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function buildDossierPrismaData(data: any): Record<string, any> {
  const res: Record<string, any> = {};

  if (data.annexeId !== undefined) res.annexeId = data.annexeId;
  if (data.clientId !== undefined) res.clientId = data.clientId;
  if (data.numero !== undefined) res.numero = data.numero;
  if (data.type !== undefined) res.type = data.type;

  const st = normalizeStatutDossier(data.statut);
  if (st !== undefined) res.statut = st;

  const vt = normalizeVoieTransport(data.voieTransport ?? data.modeTransport);
  if (vt !== undefined) res.voieTransport = vt;

  const march = data.marchandise ?? data.nature;
  if (march !== undefined) res.marchandise = march;

  const p = data.poids ?? data.poidsTotal;
  if (p !== undefined) res.poids = p !== null && p !== '' ? Number(p) : null;

  if (data.volume !== undefined) res.volume = data.volume !== null && data.volume !== '' ? Number(data.volume) : null;
  if (data.nombreColis !== undefined) {
    res.nombreColis = data.nombreColis !== null && data.nombreColis !== '' ? parseInt(data.nombreColis, 10) : null;
  }

  const nv = data.navireVol ?? data.camion;
  if (nv !== undefined) res.navireVol = nv || null;

  if (data.compagnie !== undefined) res.compagnie = data.compagnie || null;

  const bl = data.numeroBl ?? data.bl;
  if (bl !== undefined) res.numeroBl = bl || null;

  if (data.portProvenance !== undefined) res.portProvenance = data.portProvenance || null;

  const pDest = data.portDestination ?? data.portEntree;
  if (pDest !== undefined) res.portDestination = pDest || null;

  const dDepart = parseDossierDate(data.dateDepart ?? data.date);
  if (dDepart !== undefined) res.dateDepart = dDepart;

  const dArrPrev = parseDossierDate(data.dateArriveePrevue ?? data.dateEcheance);
  if (dArrPrev !== undefined) res.dateArriveePrevue = dArrPrev;

  const dArrEff = parseDossierDate(data.dateArriveeEffective ?? data.dateDedouanement);
  if (dArrEff !== undefined) res.dateArriveeEffective = dArrEff;

  const dLiv = parseDossierDate(data.dateLivraison);
  if (dLiv !== undefined) res.dateLivraison = dLiv;

  if (data.bureauDouane !== undefined) res.bureauDouane = data.bureauDouane || null;
  if (data.numeroDeclaration !== undefined) res.numeroDeclaration = data.numeroDeclaration || null;

  const dDecl = parseDossierDate(data.dateDeclaration);
  if (dDecl !== undefined) res.dateDeclaration = dDecl;

  // `fraisPrestation` : ancien nom de totalContrat (front resté en cache).
  const contrat = data.totalContrat ?? data.fraisPrestation;
  if (contrat !== undefined) res.totalContrat = toFcfa(contrat);

  // montantPaye / dateSolde ne sont jamais repris du payload :
  // syncLignesEtTotaux() les recalcule depuis les paiements.

  if (data.notes !== undefined) res.notes = data.notes || null;

  return res;
}

const ORDRE_LIGNES = [{ date: 'asc' as const }, { createdAt: 'asc' as const }];
const LIGNES_INCLUDE = {
  depensesDossier: { orderBy: ORDRE_LIGNES },
  paiements: { orderBy: ORDRE_LIGNES },
};

/** BigInt → number sur les lignes et ajout des montants calculés à la lecture. */
export function serializeDossier<T extends Record<string, any>>(d: T) {
  if (!d) return d;
  const depensesDossier = (d.depensesDossier ?? []).map((l: any) => ({ ...l, montant: toFcfa(l.montant) }));
  const paiements = (d.paiements ?? []).map((p: any) => ({ ...p, montant: toFcfa(p.montant) }));
  return {
    ...d,
    depensesDossier,
    paiements,
    finances: calculerFinancesDossier({ totalContrat: d.totalContrat, paiements, depenses: depensesDossier }),
  };
}

const parseLigneDate = (v: any) => parseDossierDate(v) ?? new Date();

/**
 * Remplace les lignes d'un dossier par celles du payload : `id` connu → mise
 * à jour, sans id (ou id inconnu) → création, absentes → suppression. Les
 * `updateMany` filtrent sur dossierId pour qu'un id d'un autre dossier ne
 * puisse jamais être modifié.
 */
async function remplacerLignes(
  delegate: any,
  dossierId: string,
  lignes: any[],
  toData: (l: any) => Record<string, any>,
) {
  const existants: Array<{ id: string }> = await delegate.findMany({ where: { dossierId }, select: { id: true } });
  const idsExistants = new Set(existants.map((e) => e.id));
  const conserves = lignes.filter((l) => l.id && idsExistants.has(l.id)).map((l) => l.id as string);
  await delegate.deleteMany({ where: { dossierId, id: { notIn: conserves } } });
  for (const l of lignes) {
    if (l.id && idsExistants.has(l.id)) {
      await delegate.updateMany({ where: { id: l.id, dossierId }, data: toData(l) });
    } else {
      await delegate.create({ data: { ...toData(l), dossierId } });
    }
  }
}

const depenseData = (l: any) => ({
  date: parseLigneDate(l.date),
  nature: String(l.nature || '').trim() || 'Dépense',
  categorie: (CATEGORIES_DEPENSE as readonly string[]).includes(l.categorie) ? l.categorie : 'DIVERS',
  montant: BigInt(toFcfa(l.montant)),
});

const paiementData = (p: any) => ({
  date: parseLigneDate(p.date),
  montant: BigInt(toFcfa(p.montant)),
  mode: (MODES_PAIEMENT as readonly string[]).includes(p.mode) ? p.mode : 'ESPECES',
  reference: p.reference ? String(p.reference) : null,
});

/**
 * Applique les dépenses / paiements du payload puis recalcule le cache
 * `montantPaye` / `dateSolde` du dossier depuis la base — jamais depuis des
 * totaux reçus du front.
 *
 * Payload ancien format (front en cache, import, OCR) : droit de douane,
 * frais de circuit et montantPaye scalaires deviennent des lignes de reprise,
 * seulement si le dossier n'a encore aucune ligne de ce type.
 */
async function syncLignesEtTotaux(tx: any, dossierId: string, data: any) {
  if (Array.isArray(data.depensesDossier)) {
    await remplacerLignes(tx.dossierDepense, dossierId, data.depensesDossier, depenseData);
  } else {
    const reprises = [
      { nature: 'Droit de douane', categorie: 'DOUANE', montant: toFcfa(data.droitDouane ?? data.valeurDouane) },
      { nature: 'Frais de circuit (reprise)', categorie: 'DIVERS', montant: toFcfa(data.fraisCircuit) },
    ].filter((r) => r.montant > 0);
    if (reprises.length && (await tx.dossierDepense.count({ where: { dossierId } })) === 0) {
      for (const r of reprises) {
        await tx.dossierDepense.create({ data: { ...depenseData(r), dossierId } });
      }
    }
  }

  if (Array.isArray(data.paiements)) {
    await remplacerLignes(tx.dossierPaiement, dossierId, data.paiements, paiementData);
  } else if (toFcfa(data.montantPaye) > 0 && (await tx.dossierPaiement.count({ where: { dossierId } })) === 0) {
    await tx.dossierPaiement.create({
      data: {
        ...paiementData({ montant: data.montantPaye, date: data.dateSolde ?? data.date, reference: 'Paiement (reprise)' }),
        dossierId,
      },
    });
  }

  const dossier = await tx.dossier.findUnique({ where: { id: dossierId }, include: LIGNES_INCLUDE });
  const f = calculerFinancesDossier({
    totalContrat: dossier.totalContrat,
    paiements: dossier.paiements,
    depenses: dossier.depensesDossier,
  });
  const dernierPaiement = dossier.paiements[dossier.paiements.length - 1];
  await tx.dossier.update({
    where: { id: dossierId },
    data: {
      montantPaye: f.montantPaye,
      dateSolde: dernierPaiement ? dernierPaiement.date : null,
    },
  });
}

@Injectable()
export class DossiersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: CurrentUserType,
    query: {
      search?: string;
      statut?: any;
      type?: any;
      annexeId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { page, limit, skip } = parsePagination(query, 20);

    assertAnnexeAccess(user, query.annexeId, 'cette annexe');

    const where: any = {
      ...buildAnnexeScopeFilter(user),
      ...(query.annexeId ? { annexeId: query.annexeId } : {}),
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              { numero: { contains: query.search } },
              { numeroBl: { contains: query.search } },
              { client: { nom: { contains: query.search } } },
              { numeroDeclaration: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.dossier.count({ where }),
      this.prisma.dossier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, nom: true, code: true } },
          annexe: { select: { id: true, nom: true, code: true } },
          conteneurs: true,
          ...LIGNES_INCLUDE,
          _count: { select: { documents: true, factures: true, depenses: true } },
        },
      }),
    ]);

    return buildPaginatedResponse(data.map(serializeDossier), total, { page, limit });
  }

  async findOne(id: string, user: CurrentUserType) {
    const dossier = await this.prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true,
        annexe: true,
        conteneurs: true,
        etapes: { orderBy: { ordre: 'asc' } },
        documents: true,
        factures: { include: { lignes: true } },
        depenses: true,
        trackingPublic: true,
        creePar: { select: { id: true, nom: true, email: true } },
        ...LIGNES_INCLUDE,
      },
    });

    if (!dossier) throw new NotFoundException(`Dossier ${id} non trouvé`);

    assertAnnexeAccess(user, dossier.annexeId, 'ce dossier');

    return serializeDossier(dossier);
  }

  async create(user: CurrentUserType, data: any) {
    assertAnnexeAccess(user, data.annexeId, 'cette annexe');

    // Vérifier l'unicité du numéro seulement si fourni
    if (data.numero && typeof data.numero === 'string') {
      const existing = await this.prisma.dossier.findUnique({ where: { numero: data.numero } });
      if (existing) throw new ConflictException(`Le numéro de dossier ${data.numero} existe déjà`);
    }

    const prismaData = buildDossierPrismaData(data);
    const conteneurs =
      data.conteneurs ?? (data.noConteneur ? [{ numero: data.noConteneur, type: '40_PIEDS', plomb: '', statut: 'EN_TRANSIT' }] : undefined);

    // Création transactionnelle avec conteneurs et code tracking
    return this.prisma.$transaction(async (tx: any) => {
      const dossier = await tx.dossier.create({
        data: {
          ...prismaData,
          numero: data.numero ?? `DOS-${Date.now()}`,
          annexeId: data.annexeId,
          clientId: data.clientId,
          statut: prismaData.statut ?? 'EN_COURS',
          creeParId: user.id,
          conteneurs: conteneurs?.length
            ? {
                create: conteneurs.map((c: any) => ({
                  numero: c.numero,
                  type: c.type || '40_PIEDS',
                  plomb: c.plomb,
                  statut: c.statut || 'EN_TRANSIT',
                })),
              }
            : undefined,
        },
      });

      // Création automatique du tracking public
      const codeTracking = `TRK-${dossier.numero}`;
      await tx.trackingPublic.create({
        data: {
          dossierId: dossier.id,
          codeTracking,
          statutAffiche: dossier.statut,
        },
      });

      // Étapes par défaut pour le suivi
      const etapesDefaut = [
        { titre: 'Ouverture du dossier', ordre: 1, completee: true, dateEffective: new Date() },
        { titre: 'Réception des documents', ordre: 2, completee: false },
        { titre: 'Déclaration en douane', ordre: 3, completee: false },
        { titre: 'Visite douanière & Liquidation', ordre: 4, completee: false },
        { titre: 'Paiement des droits de douane', ordre: 5, completee: false },
        { titre: 'Bon à enlever (BAE)', ordre: 6, completee: false },
        { titre: 'Livraison client', ordre: 7, completee: false },
      ];

      await tx.etapeDossier.createMany({
        data: etapesDefaut.map((e) => ({ ...e, dossierId: dossier.id })),
      });

      await syncLignesEtTotaux(tx, dossier.id, data);

      return serializeDossier(
        await tx.dossier.findUnique({ where: { id: dossier.id }, include: LIGNES_INCLUDE }),
      );
    });
  }

  async update(id: string, user: CurrentUserType, data: any) {
    const existing = await this.findOne(id, user);
    assertAnnexeAccess(user, data.annexeId, 'cette annexe');

    const updateData = buildDossierPrismaData(data);

    const conteneurs = data.conteneurs ?? (data.noConteneur ? [{ numero: data.noConteneur }] : undefined);
    if (conteneurs?.length) {
      for (const c of conteneurs) {
        if (!c.numero) continue;
        const existingConteneur = existing.conteneurs?.find((ex: any) => ex.numero === c.numero);
        if (!existingConteneur) {
          await this.prisma.conteneur.create({
            data: {
              dossierId: id,
              numero: c.numero,
              type: c.type || '40_PIEDS',
              plomb: c.plomb,
              statut: c.statut || 'EN_TRANSIT',
            },
          });
        }
      }
    }

    return this.prisma.$transaction(async (tx: any) => {
      await tx.dossier.update({ where: { id }, data: updateData });
      await syncLignesEtTotaux(tx, id, data);
      return serializeDossier(
        await tx.dossier.findUnique({
          where: { id },
          include: { conteneurs: true, client: true, annexe: true, ...LIGNES_INCLUDE },
        }),
      );
    });
  }

  async updateStatut(id: string, user: CurrentUserType, statut: any) {
    await this.findOne(id, user);
    const normalized = normalizeStatutDossier(statut);
    const updated = await this.prisma.dossier.update({
      where: { id },
      data: { statut: normalized as any },
      include: { client: true, annexe: true },
    });
    // Synchroniser le tracking public si existant
    await this.prisma.trackingPublic
      .updateMany({
        where: { dossierId: id },
        data: { statutAffiche: normalized as any },
      })
      .catch(() => null);

    return updated;
  }

  /** Enregistre un règlement client sur le dossier : nouvelle ligne de
   *  paiement puis recalcul des totaux. Un dépassement des frais de
   *  prestation est accepté (statut "trop-perçu" visible partout) plutôt que
   *  rejeté. Optionnellement change le statut. */
  async enregistrerPaiement(
    id: string,
    user: CurrentUserType,
    data: { montant: number; statut?: string; date?: string; mode?: string; reference?: string },
  ) {
    const dossier = await this.findOne(id, user);
    const montant = toFcfa(data.montant);
    if (montant <= 0) {
      throw new BadRequestException('Le montant du règlement doit être supérieur à 0.');
    }

    return this.prisma.$transaction(async (tx: any) => {
      await tx.dossierPaiement.create({
        data: { ...paiementData({ montant, date: data.date, mode: data.mode, reference: data.reference }), dossierId: id },
      });
      await syncLignesEtTotaux(tx, id, {});
      if (data.statut) {
        const normalized = normalizeStatutDossier(data.statut) || dossier.statut;
        await tx.dossier.update({ where: { id }, data: { statut: normalized as any } });
        await tx.trackingPublic.updateMany({
          where: { dossierId: id },
          data: { statutAffiche: normalized as any },
        });
      }
      return serializeDossier(
        await tx.dossier.findUnique({ where: { id }, include: { client: true, annexe: true, ...LIGNES_INCLUDE } }),
      );
    });
  }

  async remove(id: string, user: CurrentUserType) {
    await this.findOne(id, user);
    return this.prisma.$transaction(async (tx: any) => {
      await tx.facture.updateMany({ where: { dossierId: id }, data: { dossierId: null } });
      await tx.depense.updateMany({ where: { dossierId: id }, data: { dossierId: null } });
      await tx.devis.updateMany({ where: { dossierId: id }, data: { dossierId: null } });
      await tx.dossier.delete({ where: { id } });
      return { id };
    });
  }
}
