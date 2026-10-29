import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import type { CurrentUserType } from '../../auth/auth.types';
import { buildAnnexeScopeFilter, assertAnnexeAccess } from '../../common/annexe-filter.utils';

/** Aligne la valeur reçue sur l'enum Prisma TypeClient (PARTICULIER | ENTREPRISE | ONG | GOUVERNEMENT). */
function normalizeTypeClient(raw: unknown): 'PARTICULIER' | 'ENTREPRISE' | 'ONG' | 'GOUVERNEMENT' {
  const upper = String(raw ?? '').toUpperCase();
  if (upper === 'PARTICULIER') return 'PARTICULIER';
  if (upper === 'ONG') return 'ONG';
  if (upper === 'ETAT' || upper === 'GOUVERNEMENT') return 'GOUVERNEMENT';
  return 'ENTREPRISE';
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: CurrentUserType, search?: string) {
    return this.prisma.client.findMany({
      where: {
        actif: true,
        ...buildAnnexeScopeFilter(user, { allowUnassigned: true }),
        ...(search
          ? {
              OR: [
                { nom: { contains: search } },
                { code: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { nom: 'asc' },
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        _count: {
          select: { dossiers: true, factures: true },
        },
      },
    });
  }

  async findOne(id: string, user: CurrentUserType) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        dossiers: { take: 5, orderBy: { createdAt: 'desc' } },
        factures: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: {
          select: { dossiers: true, factures: true, devis: true, cotations: true },
        },
      },
    });
    if (!client) throw new NotFoundException(`Client ${id} non trouvé`);

    assertAnnexeAccess(user, client.annexeId, 'ce client');

    return client;
  }

  /** Pays par défaut = celui de l'annexe du client (avant : « Guinée » en dur,
   *  hérité d'un modèle de départ — tous les clients étaient enregistrés en
   *  Guinée alors que l'entreprise opère au Mali et en Côte d'Ivoire). */
  private async paysParDefaut(annexeId?: string | null): Promise<string | null> {
    if (!annexeId) return null;
    const annexe = await this.prisma.annexe.findUnique({ where: { id: annexeId }, select: { pays: true } });
    return annexe?.pays ?? null;
  }

  async create(user: CurrentUserType, data: CreateClientDto) {
    assertAnnexeAccess(user, data.annexeId, 'cette annexe');

    const baseCode = data.code || `CLT-${Date.now().toString(36).toUpperCase()}`;
    const existing = await this.prisma.client.findUnique({ where: { code: baseCode } });
    const code = existing ? `CLT-${Math.floor(1000 + Math.random() * 9000)}` : baseCode;

    const type = normalizeTypeClient(data.type);

    return this.prisma.client.create({
      data: {
        code,
        nom: data.nom,
        type,
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        pays: data.pays || (await this.paysParDefaut(data.annexeId)),
        nif: data.nif || null,
        rccm: data.rccm || null,
        actif: data.actif ?? true,
        notes: data.notes || null,
        annexeId: data.annexeId || null,
      },
      include: { annexe: { select: { id: true, nom: true, code: true } } },
    });
  }

  async update(id: string, user: CurrentUserType, data: UpdateClientDto) {
    await this.findOne(id, user);
    assertAnnexeAccess(user, data.annexeId, 'cette annexe');

    const updateData: Prisma.ClientUncheckedUpdateInput = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.telephone !== undefined) updateData.telephone = data.telephone || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.ville !== undefined) updateData.ville = data.ville || null;
    if (data.pays !== undefined) updateData.pays = data.pays || (await this.paysParDefaut(data.annexeId));
    if (data.nif !== undefined) updateData.nif = data.nif || null;
    if (data.rccm !== undefined) updateData.rccm = data.rccm || null;
    if (data.actif !== undefined) updateData.actif = data.actif;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.type !== undefined) updateData.type = normalizeTypeClient(data.type);
    if (data.annexeId !== undefined) updateData.annexeId = data.annexeId || null;

    return this.prisma.client.update({
      where: { id },
      data: updateData,
      include: { annexe: { select: { id: true, nom: true, code: true } } },
    });
  }

  async remove(id: string, user: CurrentUserType) {
    await this.findOne(id, user);
    // Un client désactivé disparaît des listes (et de la situation clients) :
    // ses créances deviendraient invisibles. On refuse tant qu'il doit encore
    // quelque chose (même règle que l'encaissé : dossiers + factures libres).
    const [dossiers, factures] = await Promise.all([
      this.prisma.dossier.findMany({ where: { clientId: id }, select: { totalContrat: true, montantPaye: true } }),
      this.prisma.facture.findMany({
        where: { clientId: id, dossierId: null, statut: { notIn: ['ANNULEE', 'BROUILLON'] } },
        select: { montantTtc: true, montantPaye: true },
      }),
    ]);
    const reste =
      dossiers.reduce((s, d) => s + Math.max(0, Math.round(d.totalContrat - d.montantPaye)), 0) +
      factures.reduce((s, f) => s + Math.max(0, Math.round(f.montantTtc - f.montantPaye)), 0);
    if (reste > 0) {
      throw new BadRequestException(
        `Ce client doit encore ${reste.toLocaleString('fr-FR')} FCFA : il ne peut pas être supprimé tant que ce montant n'est pas réglé.`,
      );
    }
    return this.prisma.client.update({ where: { id }, data: { actif: false } });
  }
}
