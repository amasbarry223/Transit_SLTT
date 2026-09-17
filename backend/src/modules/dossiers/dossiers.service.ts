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
  if (upper.includes('LIVR')) return 'LIVRE';
  if (upper.includes('ATTENTE')) return 'EN_ATTENTE_LIVRAISON';
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

  const vd = data.valeurDouane ?? data.droitDouane;
  if (vd !== undefined) res.valeurDouane = vd !== null && vd !== '' ? Number(vd) : null;

  const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  if (data.fraisCircuit !== undefined) res.fraisCircuit = num(data.fraisCircuit);
  if (data.fraisPrestation !== undefined) res.fraisPrestation = num(data.fraisPrestation);
  if (data.montantInvesti !== undefined) res.montantInvesti = num(data.montantInvesti);

  if (data.notes !== undefined) res.notes = data.notes || null;

  return res;
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
          _count: { select: { documents: true, factures: true, depenses: true } },
        },
      }),
    ]);

    return buildPaginatedResponse(data, total, { page, limit });
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
      },
    });

    if (!dossier) throw new NotFoundException(`Dossier ${id} non trouvé`);

    assertAnnexeAccess(user, dossier.annexeId, 'ce dossier');

    return dossier;
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
          montantPaye:
            data.montantPaye !== undefined && Number.isFinite(Number(data.montantPaye))
              ? Number(data.montantPaye)
              : 0,
          dateSolde:
            Number(data.montantPaye) > 0
              ? parseDossierDate(data.dateSolde ?? data.date ?? data.dateDepart) ?? new Date()
              : null,
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

      return dossier;
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

    return this.prisma.dossier.update({
      where: { id },
      data: updateData,
      include: { conteneurs: true, client: true, annexe: true },
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

  /** Enregistre un règlement client sur le dossier (incrément atomique de
   *  montantPaye, rejeté si le montant dépasse le reste dû). Optionnellement
   *  change le statut. */
  async enregistrerPaiement(
    id: string,
    user: CurrentUserType,
    data: { montant: number; statut?: string; date?: string },
  ) {
    const dossier = await this.findOne(id, user);
    const montant = Number(data.montant);
    if (!Number.isFinite(montant) || montant <= 0) {
      throw new BadRequestException('Le montant du règlement doit être supérieur à 0.');
    }
    // Rejette le trop-perçu au lieu de l'écrêter silencieusement — même règle
    // que factures.service.ts:enregistrerPaiement, pour ne jamais faire
    // disparaître un excédent sans que l'utilisateur en soit informé.
    const plafond = dossier.montantInvesti || 0;
    if (plafond > 0) {
      const reste = plafond - dossier.montantPaye;
      if (montant > reste + 0.5) {
        throw new BadRequestException(
          `Le montant dépasse le reste dû (${reste.toLocaleString('fr-FR')}).`,
        );
      }
    }
    const datePaiement = data.date ? new Date(data.date) : new Date();

    return this.prisma.$transaction(async (tx: any) => {
      await tx.dossier.update({
        where: { id },
        data: {
          montantPaye: { increment: montant },
          dateSolde: Number.isNaN(datePaiement.getTime()) ? new Date() : datePaiement,
        },
      });
      if (data.statut) {
        const normalized = normalizeStatutDossier(data.statut) || dossier.statut;
        await tx.dossier.update({ where: { id }, data: { statut: normalized as any } });
        await tx.trackingPublic.updateMany({
          where: { dossierId: id },
          data: { statutAffiche: normalized as any },
        });
      }
      return tx.dossier.findUnique({ where: { id }, include: { client: true, annexe: true } });
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
