import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import type { CurrentUserType } from '../../auth/auth.types';

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

  /** Un client sans annexe (jamais migré, cf. commentaire schema.prisma) reste
   *  visible de tous — seul un client explicitement rattaché à une annexe
   *  est restreint aux utilisateurs de cette annexe. */
  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
  }

  async findAll(user: CurrentUserType, search?: string) {
    return this.prisma.client.findMany({
      where: {
        actif: true,
        ...this.buildAnnexeFilter(user),
        ...(search
          ? {
              OR: [
                { nom: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
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

    if (client.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(client.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce client');
    }

    return client;
  }

  async create(user: CurrentUserType, data: CreateClientDto) {
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de client pour cette annexe');
    }

    const code = data.code || `CLT-${Date.now().toString(36).toUpperCase()}`;
    const existing = await this.prisma.client.findUnique({ where: { code } });
    if (existing) {
      const altCode = `CLT-${Math.floor(1000 + Math.random() * 9000)}`;
      data.code = altCode;
    } else {
      data.code = code;
    }

    const type = normalizeTypeClient(data.type);

    return this.prisma.client.create({
      data: {
        code: data.code,
        nom: data.nom,
        type,
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        pays: data.pays || 'Guinée',
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
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas rattacher ce client à cette annexe');
    }
    // "Unchecked" : autorise d'assigner directement le champ scalaire
    // annexeId (clé étrangère) sans passer par la syntaxe relationnelle
    // `annexe: { connect / disconnect }` — cohérent avec le reste du
    // service, qui manipule déjà clientId/annexeId comme de simples
    // colonnes partout ailleurs dans l'API.
    const updateData: Prisma.ClientUncheckedUpdateInput = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.telephone !== undefined) updateData.telephone = data.telephone || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.ville !== undefined) updateData.ville = data.ville || null;
    if (data.pays !== undefined) updateData.pays = data.pays || 'Guinée';
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
    return this.prisma.client.update({ where: { id }, data: { actif: false } });
  }
}
